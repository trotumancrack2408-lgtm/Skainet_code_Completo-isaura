import { PrismaService } from '../prisma/prisma.service';
export declare class TelemetryService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    recordScaleWeight(data: {
        scaleId: string;
        jewelerId: string;
        workOrderId?: string;
        phase: string;
        weight: number;
    }): Promise<{
        success: boolean;
        deviceId: string;
        registeredWeight: number;
        timestamp: Date;
    }>;
    recordLaserTelemetry(data: {
        machineId: string;
        cyclesExecuted: number;
        durationSeconds: number;
    }): Promise<{
        success: boolean;
        machineId: string;
        totalCycles: number;
        maintenanceRequired: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        machineId?: undefined;
        totalCycles?: undefined;
        maintenanceRequired?: undefined;
    }>;
    getConnectedDevices(): {
        id: string;
        name: string;
        status: string;
        protocol: string;
    }[];
}
