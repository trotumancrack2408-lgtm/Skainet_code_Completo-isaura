import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Ring {
  id: string;
  batchId: string;
  name: string;
  status: string;
  securePin: string;
}

export interface Batch {
  id: string;
  entryWeight: number;
  exitWeight: number;
  ringsCount: number;
  rings: Ring[];
  createdAt: Date;
}

@Injectable()
export class BatchesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(entryWeight: number, exitWeight: number, ringsCount: number) {
    const batchId = `B-${Date.now()}`;
    const rings: any[] = [];

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
    return rings as any[];
  }

  async getRingById(id: string) {
    return this.prisma.ring.findUnique({ where: { id } });
  }

  async updateRingStatus(id: string, status: string, securePin?: string) {
    const data: any = { status };
    if (securePin) data.securePin = securePin;
    return this.prisma.ring.update({
      where: { id },
      data
    });
  }
}
