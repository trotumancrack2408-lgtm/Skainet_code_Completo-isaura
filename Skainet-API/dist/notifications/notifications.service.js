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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
let NotificationsService = class NotificationsService {
    usersService;
    logger = new common_1.Logger('WhatsAppNotifier');
    constructor(usersService) {
        this.usersService = usersService;
    }
    async notifyAdmins(message) {
        const users = await this.usersService.findAll();
        const admins = users.filter(u => u.role === users_service_1.UserRole.ADMIN || u.role === users_service_1.UserRole.DUENO);
        for (const admin of admins) {
            if (admin.phone) {
                await this.simulateWhatsApp(admin.phone, admin.name, message);
            }
        }
    }
    async notifyClient(phone, name, orderId) {
        const trackingLink = `http://192.168.1.64:5173/track/${orderId.slice(-6)}`;
        const message = `¡Hola ${name}! 💎 Tu pedido en Skynet RV ha sido registrado. Puedes seguir el progreso de tu joya en tiempo real aquí: ${trackingLink}`;
        await this.simulateWhatsApp(phone, name, message);
    }
    async simulateWhatsApp(phone, name, message) {
        await new Promise(resolve => setTimeout(resolve, 500));
        this.logger.log(`📱 [WHATSAPP SENT] Para: ${name} (${phone}) | Msg: ${message}`);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map