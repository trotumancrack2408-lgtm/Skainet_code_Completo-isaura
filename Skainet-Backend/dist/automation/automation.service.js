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
var AutomationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AutomationService = AutomationService_1 = class AutomationService {
    prisma;
    logger = new common_1.Logger(AutomationService_1.name);
    stockTimer = null;
    machineTimer = null;
    anomalyTimer = null;
    startTime = new Date();
    lastStockCheck = null;
    lastMachineCheck = null;
    lastAnomalyCheck = null;
    constructor(prisma) {
        this.prisma = prisma;
    }
    onModuleInit() {
        this.logger.log('Iniciando Motor de Automatización y Tareas en Segundo Plano (Skainet Backend Worker)...');
        this.stockTimer = setInterval(() => this.checkStockLevels(), 60000);
        this.machineTimer = setInterval(() => this.checkMachineMaintenance(), 90000);
        this.anomalyTimer = setInterval(() => this.checkWeightAnomalies(), 45000);
        setTimeout(() => {
            this.checkStockLevels();
            this.checkMachineMaintenance();
            this.checkWeightAnomalies();
        }, 5000);
    }
    onModuleDestroy() {
        if (this.stockTimer)
            clearInterval(this.stockTimer);
        if (this.machineTimer)
            clearInterval(this.machineTimer);
        if (this.anomalyTimer)
            clearInterval(this.anomalyTimer);
        this.logger.log('Deteniendo tareas en segundo plano del Backend Worker.');
    }
    async checkStockLevels() {
        this.lastStockCheck = new Date();
        try {
            const materials = await this.prisma.material.findMany({
                where: { status: 'Activo' },
            });
            let lowCount = 0;
            for (const mat of materials) {
                if (mat.stock <= mat.minStock) {
                    lowCount++;
                    const existingAlert = await this.prisma.alert.findFirst({
                        where: {
                            type: 'STOCK_CRITICO',
                            message: { contains: mat.name },
                        },
                    });
                    if (!existingAlert) {
                        await this.prisma.alert.create({
                            data: {
                                type: 'STOCK_CRITICO',
                                message: `Stock crítico para el material: ${mat.name}. Stock actual: ${mat.stock} ${mat.unit} (Mínimo requerido: ${mat.minStock})`,
                                severity: 'CRITICAL',
                                jewelerName: 'SISTEMA_AUTOMATIZACION',
                            },
                        });
                        this.logger.warn(`Alerta automática generada: Stock crítico en ${mat.name}`);
                    }
                }
            }
            return { checkedMaterials: materials.length, lowStockCount: lowCount, timestamp: this.lastStockCheck };
        }
        catch (error) {
            this.logger.error('Error al verificar niveles de stock:', error);
            return { error: String(error) };
        }
    }
    async checkMachineMaintenance() {
        this.lastMachineCheck = new Date();
        try {
            const machines = await this.prisma.machine.findMany();
            let alertsCreated = 0;
            for (const machine of machines) {
                if (machine.cycleCount >= machine.maintenanceThreshold) {
                    const existingAlert = await this.prisma.alert.findFirst({
                        where: {
                            type: 'MANTENIMIENTO_MAQUINA',
                            message: { contains: machine.name },
                        },
                    });
                    if (!existingAlert) {
                        await this.prisma.alert.create({
                            data: {
                                type: 'MANTENIMIENTO_MAQUINA',
                                message: `Mantenimiento preventivo requerido: ${machine.name}. Ciclos completados: ${machine.cycleCount}/${machine.maintenanceThreshold}`,
                                severity: 'WARNING',
                                jewelerName: 'SISTEMA_AUTOMATIZACION',
                            },
                        });
                        alertsCreated++;
                        this.logger.warn(`Alerta de mantenimiento generada para la máquina: ${machine.name}`);
                    }
                }
            }
            return { totalMachines: machines.length, alertsCreated, timestamp: this.lastMachineCheck };
        }
        catch (error) {
            this.logger.error('Error al verificar mantenimiento de máquinas:', error);
            return { error: String(error) };
        }
    }
    async checkWeightAnomalies() {
        this.lastAnomalyCheck = new Date();
        try {
            const highLossLogs = await this.prisma.tripleWeightLog.findMany({
                where: {
                    lossPercentage: { gt: 2.5 },
                },
            });
            let updatedOrders = 0;
            for (const log of highLossLogs) {
                if (log.workOrderId) {
                    const order = await this.prisma.workOrder.findUnique({
                        where: { id: log.workOrderId },
                    });
                    if (order && !order.isAnomaly) {
                        await this.prisma.workOrder.update({
                            where: { id: log.workOrderId },
                            data: {
                                isAnomaly: true,
                                explanation: `Merma detectada automáticamente: ${log.lossPercentage}% en fase ${log.phase}`,
                            },
                        });
                        await this.prisma.alert.create({
                            data: {
                                type: 'ANOMALIA_MERMA',
                                message: `Anomalía de pérdida excesiva (${log.lossPercentage}%) en orden ${log.workOrderId} (Fase: ${log.phase})`,
                                severity: 'CRITICAL',
                                orderId: log.workOrderId,
                                jewelerName: log.jewelerId || 'Desconocido',
                            },
                        });
                        updatedOrders++;
                        this.logger.warn(`Anomalía registrada en orden ${log.workOrderId}`);
                    }
                }
            }
            return { anomaliesFound: highLossLogs.length, updatedOrders, timestamp: this.lastAnomalyCheck };
        }
        catch (error) {
            this.logger.error('Error al verificar anomalías de peso:', error);
            return { error: String(error) };
        }
    }
    getStatus() {
        return {
            status: 'ONLINE',
            service: 'Skainet Backend Worker & Automation Engine',
            port: 3001,
            startTime: this.startTime,
            uptimeSeconds: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
            monitors: {
                stock: { intervalSeconds: 60, lastRun: this.lastStockCheck },
                machines: { intervalSeconds: 90, lastRun: this.lastMachineCheck },
                anomalies: { intervalSeconds: 45, lastRun: this.lastAnomalyCheck },
            },
        };
    }
};
exports.AutomationService = AutomationService;
exports.AutomationService = AutomationService = AutomationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AutomationService);
//# sourceMappingURL=automation.service.js.map