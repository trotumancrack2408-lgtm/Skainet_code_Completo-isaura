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
exports.ClientOrdersController = void 0;
const common_1 = require("@nestjs/common");
const client_orders_service_1 = require("./client-orders.service");
let ClientOrdersController = class ClientOrdersController {
    clientOrdersService;
    constructor(clientOrdersService) {
        this.clientOrdersService = clientOrdersService;
    }
    findAll() {
        return this.clientOrdersService.findAll();
    }
    create(body) {
        return this.clientOrdersService.create(body.clientName, body.design, body.estimatedWeight, body.email, body.phone);
    }
    updateStatus(id, body) {
        return this.clientOrdersService.updateStatus(id, body.status, body.stepIndex);
    }
};
exports.ClientOrdersController = ClientOrdersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ClientOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClientOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ClientOrdersController.prototype, "updateStatus", null);
exports.ClientOrdersController = ClientOrdersController = __decorate([
    (0, common_1.Controller)('client-orders'),
    __metadata("design:paramtypes", [client_orders_service_1.ClientOrdersService])
], ClientOrdersController);
//# sourceMappingURL=client-orders.controller.js.map