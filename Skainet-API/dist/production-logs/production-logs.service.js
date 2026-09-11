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
exports.ProductionLogsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let ProductionLogsService = class ProductionLogsService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async logPhaseTime(actorId, actorRole, data) {
        if (!data.workOrderId || !data.phase || !data.action) {
            throw new common_1.BadRequestException('Faltan parámetros requeridos para la cronometría.');
        }
        const validPhases = ['diseño', 'impresión', 'embutido', 'fundición', 'pulido', 'terminado', 'engaste'];
        if (!validPhases.includes(data.phase.toLowerCase())) {
            throw new common_1.BadRequestException(`Fase no válida. Fases permitidas: ${validPhases.join(', ')}`);
        }
        const timeLog = await this.prisma.phaseTimeLog.create({
            data: {
                workOrderId: data.workOrderId,
                jewelerId: actorId,
                phase: data.phase.toLowerCase(),
                action: data.action,
                durationSeconds: Math.max(0, Number(data.durationSeconds || 0)),
            },
        });
        if (this.auditService?.log) {
            await this.auditService.log(actorId, `CRONOMETRIA_${data.action.toUpperCase()}`, 'Produccion', { workOrderId: data.workOrderId, phase: data.phase, action: data.action, durationSeconds: timeLog.durationSeconds }, actorRole);
        }
        return {
            success: true,
            message: data.action === 'Iniciar' ? 'Cronómetro iniciado para la fase seleccionada.' : `Fase ${data.action.toLowerCase()}da.`,
            timeLog,
        };
    }
    async getPhaseTimes(workOrderId) {
        return this.prisma.phaseTimeLog.findMany({
            where: { workOrderId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async logTripleWeight(actorId, actorRole, data) {
        const w1 = Number(data.weight1);
        const w2 = Number(data.weight2);
        const w3 = Number(data.weight3);
        if (isNaN(w1) || isNaN(w2) || isNaN(w3) || w1 <= 0 || w2 <= 0 || w3 <= 0) {
            throw new common_1.BadRequestException('Los tres pesos deben ser valores numéricos válidos mayores a cero.');
        }
        const maxDiff = Math.max(Math.abs(w1 - w2), Math.abs(w2 - w3), Math.abs(w1 - w3));
        if (maxDiff > 0.1) {
            throw new common_1.BadRequestException('Se detectó una discrepancia entre los tres pesos capturados. Se requiere validación de un Administrador.');
        }
        const lossPercentage = Number((((w1 - w3) / w1) * 100).toFixed(2));
        const weightLog = await this.prisma.tripleWeightLog.create({
            data: {
                workOrderId: data.workOrderId,
                jewelerId: actorId,
                phase: data.phase || 'pesaje',
                weight1: Number(w1.toFixed(2)),
                weight2: Number(w2.toFixed(2)),
                weight3: Number(w3.toFixed(2)),
                lossPercentage: Math.max(0, lossPercentage),
            },
        });
        if (this.auditService?.log) {
            await this.auditService.log(actorId, 'REGISTRO_PESAJE_TRIPLE', 'Produccion', { workOrderId: data.workOrderId, phase: data.phase, weight1: w1, weight2: w2, weight3: w3, lossPercentage }, actorRole);
        }
        return {
            success: true,
            message: `Pesaje registrado correctamente. Merma calculada: ${lossPercentage}%.`,
            weightLog,
        };
    }
    async getTripleWeights(workOrderId) {
        return this.prisma.tripleWeightLog.findMany({
            where: { workOrderId },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.ProductionLogsService = ProductionLogsService;
exports.ProductionLogsService = ProductionLogsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ProductionLogsService);
//# sourceMappingURL=production-logs.service.js.map