import { TelemetryService } from './telemetry.service';
export declare class TelemetryController {
    private readonly telemetryService;
    constructor(telemetryService: TelemetryService);
    recordScale(body: {
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
    recordLaser(body: {
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
    getDevices(): {
        id: string;
        name: string;
        status: string;
        protocol: string;
    }[];
}
