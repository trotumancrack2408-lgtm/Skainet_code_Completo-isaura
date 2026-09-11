import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { BatchesService } from '../batches/batches.service';
import { AlertsService } from '../alerts/alerts.service';
export interface OrderWeights {
    anillo: number;
    plastilina: number;
    bolsa: number;
}
export interface Order {
    id: string;
    ringId: string;
    ringName: string;
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
export declare class OrdersService implements OnModuleInit {
    private readonly prisma;
    private readonly usersService;
    private readonly batchesService;
    private readonly alertsService;
    constructor(prisma: PrismaService, usersService: UsersService, batchesService: BatchesService, alertsService: AlertsService);
    onModuleInit(): Promise<void>;
    create(data: {
        ringId: string;
        receiverId: string;
        executorId: string;
        weights: OrderWeights;
        providedPin?: string;
    }): Promise<any>;
    findAll(): Promise<any[]>;
    findActiveByExecutor(executorId: string): Promise<any>;
    closeOrder(orderId: string, finalWeights: OrderWeights, explanation?: string, providedPin?: string): Promise<any>;
    private checkTimeAlerts;
}
