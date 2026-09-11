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
exports.MachinesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const alerts_service_1 = require("../alerts/alerts.service");
let MachinesService = class MachinesService {
    prisma;
    alertsService;
    constructor(prisma, alertsService) {
        this.prisma = prisma;
        this.alertsService = alertsService;
    }
    async onModuleInit() {
        const count = await this.prisma.machine.count();
        if (count === 0) {
            await this.prisma.machine.createMany({
                data: [
                    { id: 'M-01', name: 'Láser de Marcado Fibra', type: 'LASER', status: 'OPERATIONAL', cycleCount: 420, maintenanceThreshold: 500, lastMaintenance: new Date() },
                    { id: 'M-02', name: 'Impresora 3D Chitubox', type: 'PRINTER', status: 'OPERATIONAL', cycleCount: 85, maintenanceThreshold: 100, lastMaintenance: new Date() },
                    { id: 'M-03', name: 'Estación Rhino 8', type: 'CAD', status: 'OPERATIONAL', cycleCount: 0, maintenanceThreshold: 1000, lastMaintenance: new Date() },
                ]
            });
            console.log('Seed machines completed successfully! 🛠️');
        }
    }
    async findAll() {
        return this.prisma.machine.findMany();
    }
    async incrementCycles(id) {
        const machine = await this.prisma.machine.findUnique({ where: { id } });
        if (machine) {
            const newCycleCount = machine.cycleCount + 1;
            const updated = await this.prisma.machine.update({
                where: { id },
                data: { cycleCount: newCycleCount }
            });
            if (newCycleCount >= machine.maintenanceThreshold) {
                await this.alertsService.createAlert({
                    type: 'SECURITY',
                    severity: 'WARNING',
                    jewelerName: 'SISTEMA SKYNET',
                    message: `MANTENIMIENTO REQUERIDO: La máquina ${machine.name} ha alcanzado el límite de ciclos (${newCycleCount}).`,
                });
            }
            return updated;
        }
        return null;
    }
    async reportIssue(id, issue) {
        const machine = await this.prisma.machine.findUnique({ where: { id } });
        if (machine) {
            const updated = await this.prisma.machine.update({
                where: { id },
                data: { status: 'DOWN' }
            });
            await this.alertsService.createAlert({
                type: 'SECURITY',
                severity: 'CRITICAL',
                jewelerName: 'TALLER',
                message: `FALLO DE MAQUINARIA: ${machine.name} reporta error: ${issue}. Producción detenida en este proceso.`,
            });
            return updated;
        }
        return null;
    }
    async setOperational(id) {
        return this.prisma.machine.update({
            where: { id },
            data: {
                status: 'OPERATIONAL',
                cycleCount: 0,
                lastMaintenance: new Date()
            }
        });
    }
};
exports.MachinesService = MachinesService;
exports.MachinesService = MachinesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        alerts_service_1.AlertsService])
], MachinesService);
//# sourceMappingURL=machines.service.js.map