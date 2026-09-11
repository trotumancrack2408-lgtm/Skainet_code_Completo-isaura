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
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("../notifications/notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AlertsService = class AlertsService {
    notificationsService;
    prisma;
    logger = new common_1.Logger('VigilanteDigital');
    constructor(notificationsService, prisma) {
        this.notificationsService = notificationsService;
        this.prisma = prisma;
    }
    async onModuleInit() {
        const count = await this.prisma.alert.count();
        if (count === 0) {
            this.logger.log('Seeding initial alerts...');
            await this.prisma.alert.createMany({
                data: [
                    {
                        id: 'ALT-101',
                        type: 'WEIGHT',
                        severity: 'CRITICAL',
                        jewelerName: 'Plata',
                        message: 'PÉRDIDA CRÍTICA: Se detectó merma de 0.12g (0.8%) en la pieza Anillo 3 (Lote B-101).',
                        orderId: 'ORD-103',
                        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
                    },
                    {
                        id: 'ALT-102',
                        type: 'TIME',
                        severity: 'WARNING',
                        jewelerName: 'Ramiro',
                        message: 'TIEMPO EXCEDIDO: El joyero lleva 125 min con la pieza Anillo 1 (Lote B-101).',
                        orderId: 'ORD-101',
                        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
                    },
                ],
            });
        }
    }
    async createAlert(data) {
        const newAlert = await this.prisma.alert.create({
            data: {
                type: data.type,
                severity: data.severity,
                message: data.message,
                jewelerName: data.jewelerName,
                orderId: data.orderId || null,
            },
        });
        this.sendNotifications(newAlert);
        return newAlert;
    }
    async findAll() {
        return this.prisma.alert.findMany({
            orderBy: {
                timestamp: 'desc',
            },
        });
    }
    async sendNotifications(alert) {
        const icon = alert.severity === 'CRITICAL' ? '🚨' : '⚠️';
        const message = `${icon} ALERTA SKYNET: ${alert.message} | Joyero: ${alert.jewelerName}`;
        await this.notificationsService.notifyAdmins(message);
        this.logger.log(`[ALERTA PROCESADA] Notificación enviada a administración.`);
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService,
        prisma_service_1.PrismaService])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map