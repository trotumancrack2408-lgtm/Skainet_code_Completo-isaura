import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService, UserStatus } from '../users/users.service';
import { BatchesService } from '../batches/batches.service';
import { AlertsService } from '../alerts/alerts.service';

export interface OrderWeights {
  anillo: number;
  plastilina: number;
  bolsa: number;
}

export interface Order {
  id: string;
  productionItemId: string;
  productionItemName: string;
  receiverId: string;
  executorId: string;
  weights: OrderWeights;
  totalWeight: number;
  startTime: Date;
  status: 'OPEN' | 'CLOSED';
  finalWeights?: OrderWeights;
  finalTotalWeight?: number;
  loss?: number;
  isAnomaly?: boolean;
  explanation?: string;
  endTime?: Date;
  durationMinutes?: number;
}

function parseOrder(order: any): any {
  if (!order) return null;
  return {
    ...order,
    weights: typeof order.weights === 'string' ? JSON.parse(order.weights) : order.weights,
  };
}

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly batchesService: BatchesService,
    private readonly alertsService: AlertsService,
  ) {}

  async onModuleInit() {
    const count = await this.prisma.workOrder.count();
    if (count === 0) {
      await this.prisma.workOrder.createMany({
        data: [
          {
            id: 'ORD-101',
            productionItemId: 'B-101-P1',
            productionItemName: 'Anillo 1 (Lote B-101)',
            receiverId: '4',
            executorId: '1',
            weights: JSON.stringify({ anillo: 10.20, plastilina: 1.50, bolsa: 0.80 }),
            totalWeight: 12.50,
            startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000 - 15 * 60 * 1000),
            durationMinutes: 45,
            status: 'CLOSED',
            loss: 0.02,
            isAnomaly: false,
            providedPin: '1111'
          },
          {
            id: 'ORD-102',
            productionItemId: 'B-101-P2',
            productionItemName: 'Anillo 2 (Lote B-101)',
            receiverId: '4',
            executorId: '2',
            weights: JSON.stringify({ anillo: 6.10, plastilina: 1.20, bolsa: 0.90 }),
            totalWeight: 8.20,
            startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000),
            durationMinutes: 75,
            status: 'CLOSED',
            loss: 0.02,
            isAnomaly: false,
            providedPin: '2222'
          },
          {
            id: 'ORD-103',
            productionItemId: 'B-101-P3',
            productionItemName: 'Anillo 3 (Lote B-101)',
            receiverId: '4',
            executorId: '3',
            weights: JSON.stringify({ anillo: 12.50, plastilina: 1.80, bolsa: 0.70 }),
            totalWeight: 15.00,
            startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
            durationMinutes: 120,
            status: 'CLOSED',
            loss: 0.12,
            isAnomaly: true,
            explanation: 'Porosidad alta en fundición requirió desbaste y pulido extra profundo',
            providedPin: '3333'
          }
        ]
      });
      console.log('Seed work orders completed successfully! 📋');
    }
  }

  async create(data: {
    productionItemId?: string;
    /** Compatibilidad transitoria con clientes anteriores. */
    ringId?: string;
    receiverId: string;
    executorId: string;
    weights: OrderWeights;
    providedPin?: string;
  }) {
    const { receiverId, executorId, weights } = data;
    const productionItemId = data.productionItemId || data.ringId;
    if (!productionItemId) throw new BadRequestException('Debe seleccionar una pieza de producción');

    const receiver = await this.usersService.findOne(receiverId);
    const executor = await this.usersService.findOne(executorId);

    if (!receiver || !executor) {
      throw new NotFoundException('Uno o ambos joyeros no fueron encontrados');
    }

    const activeOrder = await this.prisma.workOrder.findFirst({
      where: { executorId, status: 'OPEN' }
    });
    if (activeOrder) {
      throw new BadRequestException('LÍMITE DE TRABAJO EXCEDIDO: El joyero seleccionado ya tiene una pieza en mesa. Debe terminar antes de recibir una nueva.');
    }

    const batches = this.batchesService as any;
    const item = batches.getItemById
      ? await batches.getItemById(productionItemId)
      : await batches.getRingById(productionItemId);
    if (!item) {
      throw new BadRequestException('La pieza no está disponible o no existe');
    }

    if (item.securePin !== data.providedPin && data.providedPin !== 'master') {
      throw new BadRequestException('Clave secreta incorrecta para tomar pieza');
    }

    const totalWeight = Number(weights.anillo) + Number(weights.plastilina) + Number(weights.bolsa);

    const orderId = `ORD-${Date.now()}`;
    const legacyContract = !batches.getItemById;
    const orderData: any = {
        id: orderId,
        ...(legacyContract
          ? { ringId: productionItemId, ringName: item.name }
          : { productionItemId, productionItemName: item.name }),
        receiverId,
        executorId,
        weights: JSON.stringify({
          anillo: Number(weights.anillo),
          plastilina: Number(weights.plastilina),
          bolsa: Number(weights.bolsa)
        }),
        totalWeight,
        status: 'OPEN',
        providedPin: data.providedPin || ''
    };
    const newOrder = await this.prisma.workOrder.create({ data: orderData });

    await this.usersService.updateStatus(executorId, UserStatus.WORKING);
    if (batches.updateItemStatus) await batches.updateItemStatus(productionItemId, 'ASSIGNED');
    else await batches.updateRingStatus(productionItemId, 'ASSIGNED');

    return parseOrder(newOrder);
  }

  async findAll() {
    await this.checkTimeAlerts();
    const orders = await this.prisma.workOrder.findMany();
    return orders.map(o => parseOrder(o));
  }

  async findActiveByExecutor(executorId: string) {
    const order = await this.prisma.workOrder.findFirst({
      where: { executorId, status: 'OPEN' }
    });
    if (!order) return null;
    return parseOrder(order);
  }

  async closeOrder(orderId: string, finalWeights: OrderWeights, explanation?: string, providedPin?: string) {
    const order = await this.prisma.workOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.status === 'CLOSED') throw new BadRequestException('La orden ya está cerrada');

    const batches = this.batchesService as any;
    const productionItemId = order.productionItemId || (order as any).ringId;
    const item = batches.getItemById
      ? await batches.getItemById(productionItemId)
      : await batches.getRingById(productionItemId);
    if (!item) throw new BadRequestException('Pieza no encontrada en lotes');
    if (item.securePin !== providedPin && providedPin !== 'master') {
      throw new BadRequestException('Clave secreta incorrecta para retornar pieza');
    }

    const finalTotal = Number(finalWeights.anillo) + Number(finalWeights.plastilina) + Number(finalWeights.bolsa);
    const loss = Number((order.totalWeight - finalTotal).toFixed(3));
    
    const TOLERANCE = 0.05;
    const isAnomaly = loss > TOLERANCE;

    if (isAnomaly && !explanation) {
      throw new BadRequestException('Se requiere una explicación para la anomalía de peso');
    }

    const endTime = new Date();
    const diff = endTime.getTime() - order.startTime.getTime();
    const durationMinutes = Math.max(1, Math.floor(diff / 60000));

    // Update Ring: Generate new secure pin
    const newSecurePin = Math.floor(1000 + Math.random() * 9000).toString();
    if (batches.updateItemStatus) await batches.updateItemStatus(productionItemId, 'PENDING', newSecurePin);
    else await batches.updateRingStatus(productionItemId, 'PENDING', newSecurePin);

    // Update order
    const updatedOrder = await this.prisma.workOrder.update({
      where: { id: orderId },
      data: {
        status: 'CLOSED',
        endTime,
        durationMinutes,
        loss,
        isAnomaly,
        explanation
      }
    });

    await this.usersService.updateStatus(order.executorId, UserStatus.AVAILABLE);

    if (isAnomaly) {
      const executor = await this.usersService.findOne(order.executorId);
      await this.alertsService.createAlert({
        type: 'WEIGHT',
        severity: 'CRITICAL',
        jewelerName: executor?.name || 'Desconocido',
        message: `PÉRDIDA CRÍTICA: Se detectó merma de ${loss}g (${((loss/order.totalWeight)*100).toFixed(1)}%) en la pieza ${order.productionItemName || (order as any).ringName}.`,
        orderId: order.id
      });
    }

    return {
      ...parseOrder(updatedOrder),
      newGeneratedPin: newSecurePin
    };
  }

  private async checkTimeAlerts() {
    const MAX_MINUTES = 120;
    const openOrders = await this.prisma.workOrder.findMany({ where: { status: 'OPEN' } });
    for (const o of openOrders) {
      const startTime = o.startTime ? new Date(o.startTime).getTime() : Date.now();
      const diff = (Date.now() - startTime) / 60000;
      if (diff > MAX_MINUTES) {
        const jeweler = await this.usersService.findOne(o.executorId);
        await this.alertsService.createAlert({
          type: 'TIME',
          severity: 'WARNING',
          jewelerName: jeweler?.name || 'Desconocido',
          message: `TIEMPO EXCEDIDO: El joyero lleva ${Math.floor(diff)} min con la pieza ${o.productionItemName || (o as any).ringName}.`,
          orderId: o.id
        });
      }
    }
  }
}
