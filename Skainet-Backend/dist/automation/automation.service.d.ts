import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class AutomationService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly logger;
    private stockTimer;
    private machineTimer;
    private anomalyTimer;
    private startTime;
    private lastStockCheck;
    private lastMachineCheck;
    private lastAnomalyCheck;
    constructor(prisma: PrismaService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    checkStockLevels(): Promise<{
        checkedMaterials: number;
        lowStockCount: number;
        timestamp: Date;
        error?: undefined;
    } | {
        error: string;
        checkedMaterials?: undefined;
        lowStockCount?: undefined;
        timestamp?: undefined;
    }>;
    checkMachineMaintenance(): Promise<{
        totalMachines: number;
        alertsCreated: number;
        timestamp: Date;
        error?: undefined;
    } | {
        error: string;
        totalMachines?: undefined;
        alertsCreated?: undefined;
        timestamp?: undefined;
    }>;
    checkWeightAnomalies(): Promise<{
        anomaliesFound: number;
        updatedOrders: number;
        timestamp: Date;
        error?: undefined;
    } | {
        error: string;
        anomaliesFound?: undefined;
        updatedOrders?: undefined;
        timestamp?: undefined;
    }>;
    getStatus(): {
        status: string;
        service: string;
        port: number;
        startTime: Date;
        uptimeSeconds: number;
        monitors: {
            stock: {
                intervalSeconds: number;
                lastRun: Date | null;
            };
            machines: {
                intervalSeconds: number;
                lastRun: Date | null;
            };
            anomalies: {
                intervalSeconds: number;
                lastRun: Date | null;
            };
        };
    };
}
