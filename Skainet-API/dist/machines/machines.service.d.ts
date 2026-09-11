import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
export declare class MachinesService implements OnModuleInit {
    private readonly prisma;
    private readonly alertsService;
    constructor(prisma: PrismaService, alertsService: AlertsService);
    onModuleInit(): Promise<void>;
    findAll(): Promise<{
        id: string;
        name: string;
        status: string;
        type: string;
        cycleCount: number;
        maintenanceThreshold: number;
        lastMaintenance: Date | null;
    }[]>;
    incrementCycles(id: string): Promise<{
        id: string;
        name: string;
        status: string;
        type: string;
        cycleCount: number;
        maintenanceThreshold: number;
        lastMaintenance: Date | null;
    } | null>;
    reportIssue(id: string, issue: string): Promise<{
        id: string;
        name: string;
        status: string;
        type: string;
        cycleCount: number;
        maintenanceThreshold: number;
        lastMaintenance: Date | null;
    } | null>;
    setOperational(id: string): Promise<{
        id: string;
        name: string;
        status: string;
        type: string;
        cycleCount: number;
        maintenanceThreshold: number;
        lastMaintenance: Date | null;
    }>;
}
