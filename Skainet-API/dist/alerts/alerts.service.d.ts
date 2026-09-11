import { OnModuleInit } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
export interface Alert {
    id: string;
    type: 'WEIGHT' | 'TIME' | 'SECURITY' | string;
    severity: 'CRITICAL' | 'WARNING' | string;
    message: string;
    timestamp: Date;
    orderId?: string | null;
    jewelerName: string;
}
export declare class AlertsService implements OnModuleInit {
    private readonly notificationsService;
    private readonly prisma;
    private readonly logger;
    constructor(notificationsService: NotificationsService, prisma: PrismaService);
    onModuleInit(): Promise<void>;
    createAlert(data: Omit<Alert, 'id' | 'timestamp'>): Promise<{
        id: string;
        timestamp: Date;
        type: string;
        severity: string;
        message: string;
        orderId: string | null;
        jewelerName: string;
    }>;
    findAll(): Promise<Alert[]>;
    private sendNotifications;
}
