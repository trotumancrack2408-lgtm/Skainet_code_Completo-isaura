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
exports.MachinesController = void 0;
const common_1 = require("@nestjs/common");
const machines_service_1 = require("./machines.service");
let MachinesController = class MachinesController {
    machinesService;
    constructor(machinesService) {
        this.machinesService = machinesService;
    }
    findAll() {
        return this.machinesService.findAll();
    }
    increment(id) {
        return this.machinesService.incrementCycles(id);
    }
    report(id, issue) {
        return this.machinesService.reportIssue(id, issue);
    }
    fix(id) {
        return this.machinesService.setOperational(id);
    }
};
exports.MachinesController = MachinesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MachinesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/cycle'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MachinesController.prototype, "increment", null);
__decorate([
    (0, common_1.Post)(':id/report'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('issue')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MachinesController.prototype, "report", null);
__decorate([
    (0, common_1.Patch)(':id/fix'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MachinesController.prototype, "fix", null);
exports.MachinesController = MachinesController = __decorate([
    (0, common_1.Controller)('machines'),
    __metadata("design:paramtypes", [machines_service_1.MachinesService])
], MachinesController);
//# sourceMappingURL=machines.controller.js.map