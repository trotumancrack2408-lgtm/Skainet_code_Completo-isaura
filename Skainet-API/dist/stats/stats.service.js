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
exports.StatsService = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("../orders/orders.service");
const users_service_1 = require("../users/users.service");
const alerts_service_1 = require("../alerts/alerts.service");
let StatsService = class StatsService {
    ordersService;
    usersService;
    alertsService;
    constructor(ordersService, usersService, alertsService) {
        this.ordersService = ordersService;
        this.usersService = usersService;
        this.alertsService = alertsService;
    }
    async getGeneralStats() {
        const orders = await this.ordersService.findAll();
        const closedOrders = orders.filter(o => o.status === 'CLOSED');
        const totalLoss = closedOrders.reduce((sum, o) => sum + (o.loss || 0), 0);
        const allUsers = await this.usersService.findAll();
        const joyeros = allUsers.filter(u => u.role === 'Joyero');
        const ranking = joyeros.map(j => {
            const jOrders = closedOrders.filter(o => o.executorId === j.id);
            const avgMinutes = jOrders.length > 0
                ? jOrders.reduce((sum, o) => sum + (o.durationMinutes || 0), 0) / jOrders.length
                : 0;
            return {
                name: j.name,
                avgMinutes: Number(avgMinutes.toFixed(1)),
                completedCount: jOrders.length
            };
        }).sort((a, b) => (a.avgMinutes || 999) - (b.avgMinutes || 999));
        const alerts = await this.alertsService.findAll();
        const incidentCount = alerts.filter(a => a.severity === 'CRITICAL').length;
        return {
            totalLoss: Number(totalLoss.toFixed(3)),
            ranking,
            incidentCount,
            totalProduced: closedOrders.length,
            activeWork: orders.filter(o => o.status === 'OPEN').length
        };
    }
};
exports.StatsService = StatsService;
exports.StatsService = StatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        users_service_1.UsersService,
        alerts_service_1.AlertsService])
], StatsService);
//# sourceMappingURL=stats.service.js.map