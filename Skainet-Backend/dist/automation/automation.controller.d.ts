import { AutomationService } from './automation.service';
export declare class AutomationController {
    private readonly automationService;
    constructor(automationService: AutomationService);
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
    triggerStockCheck(): Promise<{
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
    triggerMachineCheck(): Promise<{
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
    triggerAnomalyCheck(): Promise<{
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
}
