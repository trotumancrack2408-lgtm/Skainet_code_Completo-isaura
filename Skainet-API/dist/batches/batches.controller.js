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
exports.BatchesController = void 0;
const common_1 = require("@nestjs/common");
const batches_service_1 = require("./batches.service");
const swagger_1 = require("@nestjs/swagger");
let BatchesController = class BatchesController {
    batchesService;
    constructor(batchesService) {
        this.batchesService = batchesService;
    }
    create(data) {
        return this.batchesService.create(data.entryWeight, data.exitWeight, data.ringsCount);
    }
    findAll() {
        return this.batchesService.findAll();
    }
    findPendingRings() {
        return this.batchesService.findPendingRings();
    }
};
exports.BatchesController = BatchesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BatchesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BatchesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('pending-rings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BatchesController.prototype, "findPendingRings", null);
exports.BatchesController = BatchesController = __decorate([
    (0, swagger_1.ApiTags)('Lotes'),
    (0, common_1.Controller)('batches'),
    __metadata("design:paramtypes", [batches_service_1.BatchesService])
], BatchesController);
//# sourceMappingURL=batches.controller.js.map