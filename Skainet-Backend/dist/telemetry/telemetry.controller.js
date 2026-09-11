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
exports.TelemetryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const telemetry_service_1 = require("./telemetry.service");
let TelemetryController = class TelemetryController {
    telemetryService;
    constructor(telemetryService) {
        this.telemetryService = telemetryService;
    }
    async recordScale(body) {
        return await this.telemetryService.recordScaleWeight(body);
    }
    async recordLaser(body) {
        return await this.telemetryService.recordLaserTelemetry(body);
    }
    getDevices() {
        return this.telemetryService.getConnectedDevices();
    }
};
exports.TelemetryController = TelemetryController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Registrar lectura de báscula de pesaje de precisión' }),
    (0, common_1.Post)('scale'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelemetryController.prototype, "recordScale", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Registrar telemetría de máquina láser (ciclos de grabado/corte)' }),
    (0, common_1.Post)('laser'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelemetryController.prototype, "recordLaser", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Listar dispositivos IoT y sensores conectados al taller' }),
    (0, common_1.Get)('devices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TelemetryController.prototype, "getDevices", null);
exports.TelemetryController = TelemetryController = __decorate([
    (0, swagger_1.ApiTags)('Telemetría & IoT'),
    (0, common_1.Controller)('telemetry'),
    __metadata("design:paramtypes", [telemetry_service_1.TelemetryService])
], TelemetryController);
//# sourceMappingURL=telemetry.controller.js.map