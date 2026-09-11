"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let InventoryService = class InventoryService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async createMaterial(actorId, actorRole, data) {
        if (!data.name || !data.category || !data.unit) {
            throw new common_1.BadRequestException('Debe completar todos los campos obligatorios.');
        }
        const stockInicial = Number(data.stockInicial || data.stock || 0);
        if (isNaN(stockInicial) || stockInicial < 0) {
            throw new common_1.BadRequestException('El stock inicial debe ser un valor numérico mayor o igual a cero.');
        }
        const existing = await this.prisma.material.findFirst({
            where: {
                name: { equals: data.name },
                status: 'Activo',
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Ya existe un material activo con ese nombre.');
        }
        const material = await this.prisma.material.create({
            data: {
                name: data.name.trim(),
                category: data.category,
                unit: data.unit,
                stock: stockInicial,
                minStock: Number(data.minStock || 0),
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
            await this.auditService.log(actorId, 'REGISTRAR_MATERIAL', 'Inventario', { materialId: material.id, name: material.name, stockInicial }, actorRole);
        }
        return material;
    }
    async getMaterials(query) {
        const where = {};
        if (query?.name) {
            where.name = { contains: query.name };
        }
        if (query?.category) {
            where.category = query.category;
        }
        if (query?.status) {
            where.status = query.status;
        }
        else {
            where.status = 'Activo';
        }
        return this.prisma.material.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }
    async updateMaterial(actorId, actorRole, id, data) {
        const material = await this.prisma.material.findUnique({ where: { id } });
        if (!material || material.status === 'Inactivo') {
            throw new common_1.NotFoundException('El material no existe o se encuentra inactivo.');
        }
        if (data.stock !== undefined && data.stock !== material.stock) {
            throw new common_1.BadRequestException('El stock solo puede modificarse mediante un movimiento de entrada o salida.');
        }
        if (data.name && data.name.trim() !== material.name) {
            const duplicate = await this.prisma.material.findFirst({
                where: {
                    name: { equals: data.name.trim() },
                    status: 'Activo',
                    id: { not: id },
                },
            });
            if (duplicate) {
                throw new common_1.BadRequestException('Ya existe un material activo con ese nombre.');
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
            await this.auditService.log(actorId, 'EDITAR_MATERIAL', 'Inventario', { materialId: id, changes: data }, actorRole);
        }
        return updated;
    }
    async deactivateMaterial(actorId, actorRole, id) {
        if (actorRole === 'Joyero') {
            throw new common_1.ForbiddenException('No tiene permisos para desactivar materiales.');
        }
        const material = await this.prisma.material.findUnique({ where: { id } });
        if (!material) {
            throw new common_1.NotFoundException('El material no existe.');
        }
        if (material.status === 'Inactivo') {
            throw new common_1.BadRequestException('El material ya se encuentra inactivo.');
        }
        const updated = await this.prisma.material.update({
            where: { id },
            data: { status: 'Inactivo' },
        });
        if (this.auditService?.log) {
            await this.auditService.log(actorId, 'DESACTIVAR_MATERIAL', 'Inventario', { materialId: id, previousStock: material.stock }, actorRole);
        }
        return updated;
    }
    async registerEntry(actorId, actorRole, data) {
        if (actorRole === 'Joyero') {
            throw new common_1.ForbiddenException('No tiene permisos para registrar entradas de inventario.');
        }
        const qty = Number(data.quantity);
        if (isNaN(qty) || qty <= 0) {
            throw new common_1.BadRequestException('La cantidad debe ser un valor numérico mayor a cero.');
        }
        const material = await this.prisma.material.findUnique({ where: { id: data.materialId } });
        if (!material || material.status === 'Inactivo') {
            throw new common_1.BadRequestException('No es posible registrar movimientos sobre un material inactivo.');
        }
        const newStock = Number((material.stock + qty).toFixed(2));
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
            await this.auditService.log(actorId, 'ENTRADA_INVENTARIO', 'Inventario', { materialId: material.id, quantity: qty, newStock }, actorRole);
        }
        return { success: true, message: 'Entrada registrada correctamente.', movement, newStock };
    }
    async registerSalida(actorId, actorRole, data) {
        const qty = Number(data.quantity);
        if (isNaN(qty) || qty <= 0) {
            throw new common_1.BadRequestException('La cantidad debe ser un valor numérico mayor a cero.');
        }
        if (!data.workOrderId) {
            throw new common_1.BadRequestException('Debe asociar la salida a una orden de producción.');
        }
        const material = await this.prisma.material.findUnique({ where: { id: data.materialId } });
        if (!material || material.status === 'Inactivo') {
            throw new common_1.BadRequestException('No es posible registrar movimientos sobre un material inactivo.');
        }
        if (material.stock < qty) {
            throw new common_1.BadRequestException('Error: Inventario insuficiente para realizar la operación.');
        }
        const newStock = Number((material.stock - qty).toFixed(2));
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
            await this.auditService.log(actorId, 'SALIDA_INVENTARIO', 'Inventario', { materialId: material.id, workOrderId: data.workOrderId, quantity: qty, newStock }, actorRole);
        }
        return { success: true, message: 'Salida registrada correctamente.', movement, newStock };
    }
    async getKardex(actorId, actorRole, query) {
        const where = {};
        if (query?.materialId)
            where.materialId = query.materialId;
        if (query?.type)
            where.type = query.type;
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
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map