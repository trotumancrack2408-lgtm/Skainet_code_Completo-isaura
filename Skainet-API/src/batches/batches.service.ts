import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ProductionItem {
  id: string;
  batchId: string;
  name: string;
  status: string;
  securePin: string;
  productTypeId: string;
}

export interface Batch {
  id: string;
  entryWeight: number;
  exitWeight: number;
  itemsCount: number;
  items: ProductionItem[];
  createdAt: Date;
}

@Injectable()
export class BatchesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.prisma.productType.createMany({
      data: [
        { id: 'PT-ANILLO', name: 'Anillo', category: 'Joyería', description: 'Anillo fabricado a medida' },
        { id: 'PT-CADENA', name: 'Cadena', category: 'Joyería', description: 'Cadena de joyería' },
        { id: 'PT-DIJE', name: 'Dije', category: 'Joyería', description: 'Dije o colgante' },
        { id: 'PT-PULSERA', name: 'Pulsera', category: 'Joyería', description: 'Pulsera de joyería' },
        { id: 'PT-ARETES', name: 'Aretes', category: 'Joyería', description: 'Par de aretes' },
      ], skipDuplicates: true,
    });
    const count = await this.prisma.batch.count();
    if (count === 0) {
      await this.prisma.batch.create({
        data: {
          id: 'B-101',
          entryWeight: 250.00,
          exitWeight: 242.50,
          itemsCount: 5,
          items: {
            create: [
              { id: 'B-101-P1', name: 'Anillo 1', status: 'COMPLETED', securePin: '1111', productTypeId: 'PT-ANILLO' },
              { id: 'B-101-P2', name: 'Anillo 2', status: 'COMPLETED', securePin: '2222', productTypeId: 'PT-ANILLO' },
              { id: 'B-101-P3', name: 'Anillo 3', status: 'COMPLETED', securePin: '3333', productTypeId: 'PT-ANILLO' },
              { id: 'B-101-P4', name: 'Anillo 4', status: 'COMPLETED', securePin: '4444', productTypeId: 'PT-ANILLO' },
              { id: 'B-101-P5', name: 'Anillo 5', status: 'COMPLETED', securePin: '5555', productTypeId: 'PT-ANILLO' },
            ]
          }
        }
      });
      await this.prisma.batch.create({
        data: {
          id: 'B-102',
          entryWeight: 180.00,
          exitWeight: 176.80,
          itemsCount: 3,
          items: {
            create: [
              { id: 'B-102-P1', name: 'Cadena 1', status: 'COMPLETED', securePin: '6666', productTypeId: 'PT-CADENA' },
              { id: 'B-102-P2', name: 'Cadena 2', status: 'COMPLETED', securePin: '7777', productTypeId: 'PT-CADENA' },
              { id: 'B-102-P3', name: 'Cadena 3', status: 'PENDING', securePin: '8888', productTypeId: 'PT-CADENA' },
            ]
          }
        }
      });
      console.log('Seed batches completed successfully! 💍');
    }
  }

  async create(entryWeight: number, exitWeight: number, itemsCount: number, productTypeId = 'PT-ANILLO') {
    const batchId = `B-${Date.now()}`;
    const legacyClient = (this.prisma as any).ring && !(this.prisma as any).productType;
    const productType = legacyClient ? { id: productTypeId, name: 'Anillo', status: 'Activo' } : await this.prisma.productType.findUnique({ where: { id: productTypeId } });
    if (!productType || productType.status !== 'Activo') throw new Error('El tipo de producto no existe o está inactivo');
    const items: any[] = [];

    for (let i = 1; i <= itemsCount; i++) {
      const securePin = Math.floor(1000 + Math.random() * 9000).toString();
      items.push({
        id: `${batchId}-P${i}`,
        name: `${productType.name} ${i}`,
        status: 'PENDING',
        securePin, productTypeId,
      });
    }

    return this.prisma.batch.create({
      data: {
        id: batchId,
        entryWeight,
        exitWeight,
        ...(legacyClient ? { ringsCount: itemsCount } : { itemsCount }),
        ...(legacyClient ? { rings: { create: items.map(r => ({ id: r.id, name: r.name, status: r.status, securePin: r.securePin })) } } : { items: {
          create: items.map(r => ({
            id: r.id,
            name: r.name,
            status: r.status,
            securePin: r.securePin,
            productTypeId: r.productTypeId,
          }))
        } })
      } as any,
      include: (legacyClient ? { rings: true } : { items: { include: { productType: true } } }) as any
    });
  }

  async findAll() {
    const legacyClient = (this.prisma as any).ring && !(this.prisma as any).productionItem;
    return this.prisma.batch.findMany({ include: legacyClient ? { rings: true } : { items: { include: { productType: true } } } } as any);
  }

  async findPendingItems() {
    return this.prisma.productionItem.findMany({ where: { status: 'PENDING' }, include: { productType: true } });
  }

  /** Alias transitorio para clientes y pruebas que aún usan la API anterior. */
  async findPendingRings() {
    const legacyRing = (this.prisma as any).ring;
    return legacyRing ? legacyRing.findMany({ where: { status: 'PENDING' } }) : this.findPendingItems();
  }

  async getItemById(id: string) {
    return this.prisma.productionItem.findUnique({ where: { id }, include: { productType: true } });
  }
  async getRingById(id: string) {
    const legacyRing = (this.prisma as any).ring;
    return legacyRing ? legacyRing.findUnique({ where: { id } }) : this.getItemById(id);
  }

  async updateItemStatus(id: string, status: string, securePin?: string) {
    const data: any = { status };
    if (securePin) data.securePin = securePin;
    return this.prisma.productionItem.update({
      where: { id },
      data
    });
  }
  async updateRingStatus(id: string, status: string, securePin?: string) {
    const legacyRing = (this.prisma as any).ring;
    if (legacyRing) {
      const data: any = { status };
      if (securePin) data.securePin = securePin;
      return legacyRing.update({ where: { id }, data });
    }
    return this.updateItemStatus(id, status, securePin);
  }

  async findProductTypes() { return this.prisma.productType.findMany({ where: { status: 'Activo' }, orderBy: { name: 'asc' } }); }
}
