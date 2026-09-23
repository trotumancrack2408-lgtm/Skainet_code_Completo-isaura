import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  private validateScaleQuantity(value: unknown, fieldName: string, allowZero = false): number {
    const quantity = Number(value);
    const isValidValue = Number.isFinite(quantity) && (allowZero ? quantity >= 0 : quantity > 0);
    const hasOneDecimalOrLess = Math.abs(quantity * 10 - Math.round(quantity * 10)) < Number.EPSILON * 10;

    if (!isValidValue) {
      throw new BadRequestException(`${fieldName} debe ser un valor numérico ${allowZero ? 'mayor o igual a cero' : 'mayor a cero'}.`);
    }

    if (!hasOneDecimalOrLess) {
      throw new BadRequestException(`${fieldName} solo admite incrementos de 0.1, porque la báscula no mide una precisión mayor.`);
    }

    return Number(quantity.toFixed(1));
  }

  // RF-004.1 Registrar Material
  async createMaterial(actorId: string, actorRole: string, data: any) {
    if (!data.name || !data.category || !data.unit) {
      throw new BadRequestException('Debe completar todos los campos obligatorios.');
    }

    const stockInicial = this.validateScaleQuantity(data.stockInicial ?? data.stock ?? 0, 'El stock inicial', true);
    const minStock = this.validateScaleQuantity(data.minStock ?? 0, 'El stock mínimo', true);

    // Validar duplicado entre materiales activos (FA-01)
    const existing = await this.prisma.material.findFirst({
      where: {
        name: { equals: data.name },
        status: 'Activo',
      },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un material activo con ese nombre.');
    }

    const material = await this.prisma.material.create({
      data: {
        name: data.name.trim(),
        category: data.category,
        unit: data.unit,
        stock: stockInicial,
        minStock,
        status: 'Activo',
      },
    });

    if (stockInicial > 0) {
      await this.prisma.kardexMovement.create({
        data: {
          materialId: material.id,
          type: 'ENTRADA',
          quantity: stockInicial,
          observations: 'Stock inicial al registrar material',
          responsibleId: actorId,
        },
      });
    }

    if (this.auditService?.log) {
      await this.auditService.log(
        actorId,
        'REGISTRAR_MATERIAL',
        'Inventario',
        { materialId: material.id, name: material.name, stockInicial },
        actorRole,
      );
    }

    return material;
  }

  // RF-004.2 Consultar Materiales / Inventario
  async getMaterials(query?: { name?: string; category?: string; status?: string }) {
    const where: any = {};
    if (query?.name) {
      where.name = { contains: query.name };
    }
    if (query?.category) {
      where.category = query.category;
    }
    if (query?.status) {
      where.status = query.status;
    } else {
      where.status = 'Activo'; // Por defecto solo activos
    }

    return this.prisma.material.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  // RF-004.3 Editar Material (Metadatos)
  async updateMaterial(actorId: string, actorRole: string, id: string, data: any) {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material || material.status === 'Inactivo') {
      throw new NotFoundException('El material no existe o se encuentra inactivo.');
    }

    // RN-022 El stock no se edita directamente desde la ficha
    if (data.stock !== undefined && data.stock !== material.stock) {
      throw new BadRequestException('El stock solo puede modificarse mediante un movimiento de entrada o salida.');
    }

    // Validar duplicado de nombre
    if (data.name && data.name.trim() !== material.name) {
      const duplicate = await this.prisma.material.findFirst({
        where: {
          name: { equals: data.name.trim() },
          status: 'Activo',
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new BadRequestException('Ya existe un material activo con ese nombre.');
      }
    }

    const updated = await this.prisma.material.update({
      where: { id },
      data: {
        name: data.name ? data.name.trim() : material.name,
        category: data.category || material.category,
        unit: data.unit || material.unit,
        minStock: data.minStock !== undefined ? Number(data.minStock) : material.minStock,
      },
    });

    if (this.auditService?.log) {
      await this.auditService.log(
        actorId,
        'EDITAR_MATERIAL',
        'Inventario',
        { materialId: id, changes: data },
        actorRole,
      );
    }

    return updated;
  }

  // RF-004.4 Eliminar Material (Baja Lógica)
  async deactivateMaterial(actorId: string, actorRole: string, id: string) {
    // Restricción de rol (RN-019): Únicamente el Administrador puede desactivar un material
    if (actorRole === 'Joyero') {
      throw new ForbiddenException('No tiene permisos para desactivar materiales.');
    }

    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material) {
      throw new NotFoundException('El material no existe.');
    }
    if (material.status === 'Inactivo') {
      throw new BadRequestException('El material ya se encuentra inactivo.');
    }

    const updated = await this.prisma.material.update({
      where: { id },
      data: { status: 'Inactivo' },
    });

    if (this.auditService?.log) {
      await this.auditService.log(
        actorId,
        'DESACTIVAR_MATERIAL',
        'Inventario',
        { materialId: id, previousStock: material.stock },
        actorRole,
      );
    }

    return updated;
  }

  // RF-004.5 Registrar Entrada de Material
  async registerEntry(actorId: string, actorRole: string, data: { materialId: string; quantity: number; originProvider?: string; observations?: string }) {
    if (actorRole === 'Joyero') {
      throw new ForbiddenException('No tiene permisos para registrar entradas de inventario.');
    }

    const qty = this.validateScaleQuantity(data.quantity, 'La cantidad');

    const material = await this.prisma.material.findUnique({ where: { id: data.materialId } });
    if (!material || material.status === 'Inactivo') {
      throw new BadRequestException('No es posible registrar movimientos sobre un material inactivo.');
    }

    const newStock = Number((material.stock + qty).toFixed(1));

    await this.prisma.material.update({
      where: { id: material.id },
      data: { stock: newStock },
    });

    const movement = await this.prisma.kardexMovement.create({
      data: {
        materialId: material.id,
        type: 'ENTRADA',
        quantity: qty,
        originProvider: data.originProvider || null,
        observations: data.observations || null,
        responsibleId: actorId,
      },
    });

    if (this.auditService?.log) {
      await this.auditService.log(
        actorId,
        'ENTRADA_INVENTARIO',
        'Inventario',
        { materialId: material.id, quantity: qty, newStock },
        actorRole,
      );
    }

    return { success: true, message: 'Entrada registrada correctamente.', movement, newStock };
  }

  // RF-004.6 Registrar Salida de Material
  async registerSalida(actorId: string, actorRole: string, data: { materialId: string; quantity: number; workOrderId: string; observations?: string }) {
    const qty = this.validateScaleQuantity(data.quantity, 'La cantidad');

    // RN-021 Debe asociar la salida a una orden de producción
    if (!data.workOrderId) {
      throw new BadRequestException('Debe asociar la salida a una orden de producción.');
    }

    const material = await this.prisma.material.findUnique({ where: { id: data.materialId } });
    if (!material || material.status === 'Inactivo') {
      throw new BadRequestException('No es posible registrar movimientos sobre un material inactivo.');
    }

    // RN-017 El inventario no puede quedar en saldo negativo
    if (material.stock < qty) {
      throw new BadRequestException('Error: Inventario insuficiente para realizar la operación.');
    }

    const newStock = Number((material.stock - qty).toFixed(1));

    await this.prisma.material.update({
      where: { id: material.id },
      data: { stock: newStock },
    });

    const movement = await this.prisma.kardexMovement.create({
      data: {
        materialId: material.id,
        type: 'SALIDA',
        quantity: qty,
        workOrderId: data.workOrderId,
        observations: data.observations || null,
        responsibleId: actorId,
      },
    });

    if (this.auditService?.log) {
      await this.auditService.log(
        actorId,
        'SALIDA_INVENTARIO',
        'Inventario',
        { materialId: material.id, workOrderId: data.workOrderId, quantity: qty, newStock },
        actorRole,
      );
    }

    return { success: true, message: 'Salida registrada correctamente.', movement, newStock };
  }

  // RF-004.7 Consultar Kardex
  async getKardex(actorId: string, actorRole: string, query?: { materialId?: string; type?: string }) {
    const where: any = {};
    if (query?.materialId) where.materialId = query.materialId;
    if (query?.type) where.type = query.type;

    // RN-020 Joyero solo consulta los movimientos donde él figura como responsable
    if (actorRole === 'Joyero') {
      where.responsibleId = actorId;
    }

    return this.prisma.kardexMovement.findMany({
      where,
      include: {
        material: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
