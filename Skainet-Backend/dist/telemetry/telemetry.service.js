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
var TelemetryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TelemetryService = TelemetryService_1 = class TelemetryService {
    prisma;
    logger = new common_1.Logger(TelemetryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordScaleWeight(data) {
        this.logger.log(`Lectura recibida de báscula [${data.scaleId}]: ${data.weight}g por joyero ${data.jewelerId}`);
        await this.prisma.auditLog.create({
            data: {
                actorId: data.jewelerId,
                actorRole: 'TELEMETRIA_BASCULA',
                action: 'PESAJE_DIGITAL',
                module: 'TELEMETRY',
                details: JSON.stringify(data),
            },
        });
        return {
            success: true,
            deviceId: data.scaleId,
            registeredWeight: data.weight,
            timestamp: new Date(),
        };
    }
    async recordLaserTelemetry(data) {
        this.logger.log(`Telemetría recibida de máquina láser [${data.machineId}]: +${data.cyclesExecuted} ciclos`);
        const machine = await this.prisma.machine.findUnique({
            where: { id: data.machineId },
        });
        if (machine) {
            const updated = await this.prisma.machine.update({
                where: { id: data.machineId },
                data: {
                    cycleCount: machine.cycleCount + data.cyclesExecuted,
                },
            });
            return {
                success: true,
                machineId: data.machineId,
                totalCycles: updated.cycleCount,
                maintenanceRequired: updated.cycleCount >= updated.maintenanceThreshold,
            };
        }
        return { success: false, message: 'Máquina no encontrada' };
    }
    getConnectedDevices() {
        return [
            { id: 'SCALE-KERN-01', name: 'Báscula Analítica Kern (Mesa 1)', status: 'ONLINE', protocol: 'RS232/USB' },
            { id: 'SCALE-KERN-02', name: 'Báscula Analítica Kern (Mesa 2)', status: 'ONLINE', protocol: 'RS232/USB' },
            { id: 'LASER-FIBER-01', name: 'Grabadora Láser Fibra 50W', status: 'STANDBY', protocol: 'TCP/IP' },
            { id: 'LASER-WELD-01', name: 'Soldadora Láser Nd:YAG', status: 'OPERATIONAL', protocol: 'TCP/IP' },
        ];
    }
};
exports.TelemetryService = TelemetryService;
exports.TelemetryService = TelemetryService = TelemetryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TelemetryService);
//# sourceMappingURL=telemetry.service.js.map