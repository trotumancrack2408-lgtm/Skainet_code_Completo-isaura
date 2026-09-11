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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async getMaterials(name, category, status) {
        return this.inventoryService.getMaterials({ name, category, status });
    }
    async createMaterial(req, body) {
        const actorId = req.user?.sub || body.actorId || 'SISTEMA';
        const actorRole = req.user?.role || body.actorRole || 'Administrador';
        return this.inventoryService.createMaterial(actorId, actorRole, body);
    }
    async updateMaterial(id, req, body) {
        const actorId = req.user?.sub || body.actorId || 'SISTEMA';
        const actorRole = req.user?.role || body.actorRole || 'Administrador';
        return this.inventoryService.updateMaterial(actorId, actorRole, id, body);
    }
    async deactivateMaterial(id, req, body) {
        const actorId = req.user?.sub || body?.actorId || 'SISTEMA';
        const actorRole = req.user?.role || body?.actorRole || 'Administrador';
        return this.inventoryService.deactivateMaterial(actorId, actorRole, id);
    }
    async registerEntry(req, body) {
        const actorId = req.user?.sub || body.actorId || 'SISTEMA';
        const actorRole = req.user?.role || body.actorRole || 'Administrador';
        return this.inventoryService.registerEntry(actorId, actorRole, body);
    }
    async registerExit(req, body) {
        const actorId = req.user?.sub || body.actorId || 'SISTEMA';
        const actorRole = req.user?.role || body.actorRole || 'Joyero';
        return this.inventoryService.registerSalida(actorId, actorRole, body);
    }
    async getKardex(req, materialId, type) {
        const actorId = req.user?.sub || 'SISTEMA';
        const actorRole = req.user?.role || 'Administrador';
        return this.inventoryService.getKardex(actorId, actorRole, { materialId, type });
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('materials'),
    __param(0, (0, common_1.Query)('name')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getMaterials", null);
__decorate([
    (0, common_1.Post)('materials'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createMaterial", null);
__decorate([
    (0, common_1.Patch)('materials/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateMaterial", null);
__decorate([
    (0, common_1.Delete)('materials/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "deactivateMaterial", null);
__decorate([
    (0, common_1.Post)('entry'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "registerEntry", null);
__decorate([
    (0, common_1.Post)('exit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "registerExit", null);
__decorate([
    (0, common_1.Get)('kardex'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('materialId')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getKardex", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventario'),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map