import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InventoryService } from '../../src/inventory/inventory.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';

describe('InventoryService - Pruebas Unitarias', () => {
  let service: InventoryService;
  let prismaMock: any;
  let auditServiceMock: any;

  const mockMaterial = {
    id: 'mat-001',
    name: 'Oro 18K',
    category: 'Metal precioso',
    unit: 'gramos',
    stock: 100.0,
    minStock: 10.0,
    status: 'Activo',
  };

  beforeEach(async () => {
    prismaMock = {
      material: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      kardexMovement: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    auditServiceMock = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditServiceMock },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  // RF-004.1: Registrar Material
  it('1. createMaterial: Debe registrar un material exitosamente con stock inicial', async () => {
    prismaMock.material.findFirst.mockResolvedValue(null);
    prismaMock.material.create.mockResolvedValue(mockMaterial);

    const res = await service.createMaterial('admin-1', 'SuperAdministrador', {
      name: 'Oro 18K',
      category: 'Metal precioso',
      unit: 'gramos',
      stockInicial: 100,
    });

    expect(res.id).toBe('mat-001');
    expect(prismaMock.kardexMovement.create).toHaveBeenCalled();
    expect(auditServiceMock.log).toHaveBeenCalledWith(
      'admin-1',
      'REGISTRAR_MATERIAL',
      'Inventario',
      expect.any(Object),
      'SuperAdministrador',
    );
  });

  it('2. createMaterial: Debe rechazar el registro con nombre duplicado entre activos', async () => {
    prismaMock.material.findFirst.mockResolvedValue(mockMaterial);

    await expect(
      service.createMaterial('admin-1', 'SuperAdministrador', {
        name: 'Oro 18K',
        category: 'Metal precioso',
        unit: 'gramos',
      }),
    ).rejects.toThrow('Ya existe un material activo con ese nombre.');
  });

  it('3. createMaterial: Debe rechazar stock inicial negativo o no numérico', async () => {
    await expect(
      service.createMaterial('admin-1', 'SuperAdministrador', {
        name: 'Plata',
        category: 'Metal',
        unit: 'g',
        stockInicial: -50,
      }),
    ).rejects.toThrow('El stock inicial debe ser un valor numérico mayor o igual a cero.');
  });

  // RF-004.2: Consultar Materiales
  it('4. getMaterials: Debe retornar listado completo de materiales filtrados por estado o categoría', async () => {
    prismaMock.material.findMany.mockResolvedValue([mockMaterial]);

    const result = await service.getMaterials({ category: 'Metal precioso' });

    expect(prismaMock.material.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  // RF-004.3: Editar Material
  it('5. updateMaterial: Debe actualizar metadatos y bloquear modificación directa de stock', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMaterial);
    prismaMock.material.findFirst.mockResolvedValue(null);
    prismaMock.material.update.mockResolvedValue({ ...mockMaterial, category: 'Novedades' });

    const updated = await service.updateMaterial('admin-1', 'Administrador', 'mat-001', {
      category: 'Novedades',
    });

    expect(updated.category).toBe('Novedades');

    // Intentar alterar stock directamente
    await expect(
      service.updateMaterial('admin-1', 'Administrador', 'mat-001', { stock: 999 }),
    ).rejects.toThrow('El stock solo puede modificarse mediante un movimiento de entrada o salida.');
  });

  // RF-004.4: Desactivar Material
  it('6. deactivateMaterial: Debe cambiar estado a Inactivo y denegar permiso a Joyero', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMaterial);
    prismaMock.material.update.mockResolvedValue({ ...mockMaterial, status: 'Inactivo' });

    // Intento con Joyero
    await expect(
      service.deactivateMaterial('joyero-1', 'Joyero', 'mat-001'),
    ).rejects.toThrow('No tiene permisos para desactivar materiales.');

    // Intento con Admin
    const deactivated = await service.deactivateMaterial('admin-1', 'Administrador', 'mat-001');
    expect(deactivated.status).toBe('Inactivo');
  });

  // RF-004.5: Registrar Entrada
  it('7. registerEntry: Debe registrar entrada e incrementar el stock correctamente', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMaterial);
    prismaMock.material.update.mockResolvedValue({ ...mockMaterial, stock: 150.0 });
    prismaMock.kardexMovement.create.mockResolvedValue({ id: 'k-1', type: 'ENTRADA', quantity: 50 });

    const res = await service.registerEntry('admin-1', 'Administrador', {
      materialId: 'mat-001',
      quantity: 50,
    });

    expect(res.success).toBe(true);
    expect(res.newStock).toBe(150.0);
  });

  it('8. registerEntry: Debe rechazar cantidad de entrada <= 0 o sobre material inactivo', async () => {
    prismaMock.material.findUnique.mockResolvedValue({ ...mockMaterial, status: 'Inactivo' });

    await expect(
      service.registerEntry('admin-1', 'Administrador', { materialId: 'mat-001', quantity: 0 }),
    ).rejects.toThrow('La cantidad debe ser un valor numérico mayor a cero.');

    await expect(
      service.registerEntry('admin-1', 'Administrador', { materialId: 'mat-001', quantity: 10 }),
    ).rejects.toThrow('No es posible registrar movimientos sobre un material inactivo.');
  });

  // RF-004.6: Registrar Salida
  it('9. registerSalida: Debe descontar stock si existe suficiente y tiene orden asociada', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMaterial);
    prismaMock.material.update.mockResolvedValue({ ...mockMaterial, stock: 80.0 });
    prismaMock.kardexMovement.create.mockResolvedValue({ id: 'k-2', type: 'SALIDA', quantity: 20 });

    const res = await service.registerSalida('joyero-1', 'Joyero', {
      materialId: 'mat-001',
      quantity: 20,
      workOrderId: 'ORD-100',
    });

    expect(res.success).toBe(true);
    expect(res.newStock).toBe(80.0);
  });

  it('10. registerSalida: Debe rechazar salida si no tiene orden asociada o si supera el stock disponible', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMaterial);

    // Sin orden de trabajo
    await expect(
      service.registerSalida('joyero-1', 'Joyero', { materialId: 'mat-001', quantity: 20, workOrderId: '' }),
    ).rejects.toThrow('Debe asociar la salida a una orden de producción.');

    // Supera el stock
    await expect(
      service.registerSalida('joyero-1', 'Joyero', { materialId: 'mat-001', quantity: 500, workOrderId: 'ORD-100' }),
    ).rejects.toThrow('Error: Inventario insuficiente para realizar la operación.');
  });

  // RF-004.7: Consultar Kardex
  it('11. getKardex: Administrador ve todos los movimientos y Joyero ve solo los propios', async () => {
    prismaMock.kardexMovement.findMany.mockResolvedValue([]);

    await service.getKardex('admin-1', 'Administrador');
    expect(prismaMock.kardexMovement.findMany).toHaveBeenCalledWith({
      where: {},
      include: { material: true },
      orderBy: { createdAt: 'desc' },
    });

    await service.getKardex('joyero-1', 'Joyero');
    expect(prismaMock.kardexMovement.findMany).toHaveBeenCalledWith({
      where: { responsibleId: 'joyero-1' },
      include: { material: true },
      orderBy: { createdAt: 'desc' },
    });
  });
});
