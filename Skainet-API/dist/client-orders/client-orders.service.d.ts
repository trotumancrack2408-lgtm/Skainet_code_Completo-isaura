import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ClientOrdersService implements OnModuleInit {
    private readonly prisma;
    private readonly notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    onModuleInit(): Promise<void>;
    findAll(): Promise<{
        id: string;
        status: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        shortId: string;
        clientName: string;
        design: string;
        estimatedWeight: number;
        stepIndex: number;
    }[]>;
    create(name: string, design: string, weight: number, email?: string, phone?: string): Promise<{
        id: string;
        status: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        shortId: string;
        clientName: string;
        design: string;
        estimatedWeight: number;
        stepIndex: number;
    }>;
    updateStatus(shortId: string, status: string, stepIndex?: number): Promise<{
        id: string;
        status: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        shortId: string;
        clientName: string;
        design: string;
        estimatedWeight: number;
        stepIndex: number;
    }>;
}
