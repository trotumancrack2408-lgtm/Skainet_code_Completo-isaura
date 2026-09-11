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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SearchService = class SearchService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async globalSearch(actorId, actorRole, term, filterModule) {
        if (!term || term.trim().length === 0) {
            throw new common_1.BadRequestException('Debe ingresar un término de búsqueda.');
        }
        const queryStr = term.trim();
        const results = {
            users: [],
            materials: [],
            orders: [],
        };
        const searchUsers = !filterModule || filterModule === 'usuarios' || filterModule === 'all';
        const searchMaterials = !filterModule || filterModule === 'inventario' || filterModule === 'all';
        const searchOrders = !filterModule || filterModule === 'ordenes' || filterModule === 'all';
        if (searchUsers && (actorRole === 'Super Administrador' || actorRole === 'Dueno' || actorRole === 'Administrador')) {
            const users = (await this.prisma.user.findMany({
                where: {
                    OR: [
                        { id: { contains: queryStr } },
                        { name: { contains: queryStr } },
                        { email: { contains: queryStr } },
                    ],
                },
                take: 10,
            })) || [];
            results.users = users.map(({ password, ...u }) => u);
        }
        if (searchMaterials) {
            const materials = (await this.prisma.material.findMany({
                where: {
                    OR: [
                        { name: { contains: queryStr } },
                        { category: { contains: queryStr } },
                    ],
                },
                take: 10,
            })) || [];
            results.materials = materials;
        }
        if (searchOrders) {
            const orderWhere = {
                OR: [
                    { id: { contains: queryStr } },
                    { ringName: { contains: queryStr } },
                ],
            };
            if (actorRole === 'Joyero') {
                orderWhere.executorId = actorId;
            }
            const orders = (await this.prisma.workOrder.findMany({
                where: orderWhere,
                take: 10,
            })) || [];
            results.orders = orders;
        }
        return results;
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map