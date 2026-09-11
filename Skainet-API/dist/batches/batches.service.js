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
exports.BatchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BatchesService = class BatchesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        const count = await this.prisma.batch.count();
        if (count === 0) {
            await this.prisma.batch.create({
                data: {
                    id: 'B-101',
                    entryWeight: 250.00,
                    exitWeight: 242.50,
                    ringsCount: 5,
                    rings: {
                        create: [
                            { id: 'B-101-R1', name: 'Anillo 1', status: 'COMPLETED', securePin: '1111' },
                            { id: 'B-101-R2', name: 'Anillo 2', status: 'COMPLETED', securePin: '2222' },
                            { id: 'B-101-R3', name: 'Anillo 3', status: 'COMPLETED', securePin: '3333' },
                            { id: 'B-101-R4', name: 'Anillo 4', status: 'COMPLETED', securePin: '4444' },
                            { id: 'B-101-R5', name: 'Anillo 5', status: 'COMPLETED', securePin: '5555' },
                        ]
                    }
                }
            });
            await this.prisma.batch.create({
                data: {
                    id: 'B-102',
                    entryWeight: 180.00,
                    exitWeight: 176.80,
                    ringsCount: 3,
                    rings: {
                        create: [
                            { id: 'B-102-R1', name: 'Anillo 1', status: 'COMPLETED', securePin: '6666' },
                            { id: 'B-102-R2', name: 'Anillo 2', status: 'COMPLETED', securePin: '7777' },
                            { id: 'B-102-R3', name: 'Anillo 3', status: 'PENDING', securePin: '8888' },
                        ]
                    }
                }
            });
            console.log('Seed batches completed successfully! 💍');
        }
    }
    async create(entryWeight, exitWeight, ringsCount) {
        const batchId = `B-${Date.now()}`;
        const rings = [];
        for (let i = 1; i <= ringsCount; i++) {
            const securePin = Math.floor(1000 + Math.random() * 9000).toString();
            rings.push({
                id: `${batchId}-R${i}`,
                name: `Anillo ${i}`,
                status: 'PENDING',
                securePin,
            });
        }
        return this.prisma.batch.create({
            data: {
                id: batchId,
                entryWeight,
                exitWeight,
                ringsCount,
                rings: {
                    create: rings.map(r => ({
                        id: r.id,
                        name: r.name,
                        status: r.status,
                        securePin: r.securePin
                    }))
                }
            },
            include: { rings: true }
        });
    }
    async findAll() {
        return this.prisma.batch.findMany({ include: { rings: true } });
    }
    async findPendingRings() {
        const rings = await this.prisma.ring.findMany({ where: { status: 'PENDING' } });
        return rings;
    }
    async getRingById(id) {
        return this.prisma.ring.findUnique({ where: { id } });
    }
    async updateRingStatus(id, status, securePin) {
        const data = { status };
        if (securePin)
            data.securePin = securePin;
        return this.prisma.ring.update({
            where: { id },
            data
        });
    }
};
exports.BatchesService = BatchesService;
exports.BatchesService = BatchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BatchesService);
//# sourceMappingURL=batches.service.js.map