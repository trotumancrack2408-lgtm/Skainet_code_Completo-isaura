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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const automation_service_1 = require("./automation.service");
let AutomationController = class AutomationController {
    automationService;
    constructor(automationService) {
        this.automationService = automationService;
    }
    getStatus() {
        return this.automationService.getStatus();
    }
    async triggerStockCheck() {
        return await this.automationService.checkStockLevels();
    }
    async triggerMachineCheck() {
        return await this.automationService.checkMachineMaintenance();
    }
    async triggerAnomalyCheck() {
        return await this.automationService.checkWeightAnomalies();
    }
};
exports.AutomationController = AutomationController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Obtener estado y métricas del Worker en segundo plano' }),
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AutomationController.prototype, "getStatus", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Disparar revisión manual inmediata de stock crítico' }),
    (0, common_1.Post)('trigger-stock-check'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "triggerStockCheck", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Disparar revisión manual inmediata de máquinas láser' }),
    (0, common_1.Post)('trigger-machine-check'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "triggerMachineCheck", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Disparar auditoría manual inmediata de anomalías y mermas' }),
    (0, common_1.Post)('trigger-anomaly-check'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "triggerAnomalyCheck", null);
exports.AutomationController = AutomationController = __decorate([
    (0, swagger_1.ApiTags)('Automatización & Worker'),
    (0, common_1.Controller)('automation'),
    __metadata("design:paramtypes", [automation_service_1.AutomationService])
], AutomationController);
//# sourceMappingURL=automation.controller.js.map