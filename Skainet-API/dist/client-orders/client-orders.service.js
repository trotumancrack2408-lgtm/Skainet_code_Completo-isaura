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
exports.ClientOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let ClientOrdersService = class ClientOrdersService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async onModuleInit() {
        const count = await this.prisma.clientOrder.count();
        if (count === 0) {
            await this.prisma.clientOrder.createMany({
                data: [
                    {
                        shortId: '9845',
                        clientName: 'Marcela Gómez',
                        email: 'marcela@example.com',
                        phone: '+573001234567',
                        design: 'Anillo de Compromiso Oro Blanco 18k',
                        estimatedWeight: 8.5,
                        status: 'En Espera',
                        stepIndex: 0
                    },
                    {
                        shortId: '4312',
                        clientName: 'Andrés Felipe',
                        email: 'andres@example.com',
                        phone: '+573007654321',
                        design: 'Argollas de Matrimonio Clásicas',
                        estimatedWeight: 14.2,
                        status: 'En Proceso',
                        stepIndex: 2
                    }
                ]
            });
            console.log('Seed client orders completed successfully! 📦');
        }
    }
    async findAll() {
        return this.prisma.clientOrder.findMany();
    }
    async create(name, design, weight, email, phone) {
        const shortId = Math.floor(1000 + Math.random() * 9000).toString();
        const newOrder = await this.prisma.clientOrder.create({
            data: {
                shortId,
                clientName: name,
                email,
                phone,
                design,
                estimatedWeight: weight,
                status: 'En Espera',
                stepIndex: 0
            }
        });
        if (phone) {
            this.notificationsService.notifyClient(phone, name, shortId);
        }
        return newOrder;
    }
    async updateStatus(shortId, status, stepIndex) {
        const data = { status };
        if (stepIndex !== undefined)
            data.stepIndex = stepIndex;
        return this.prisma.clientOrder.update({
            where: { shortId },
            data
        });
    }
};
exports.ClientOrdersService = ClientOrdersService;
exports.ClientOrdersService = ClientOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ClientOrdersService);
//# sourceMappingURL=client-orders.service.js.map