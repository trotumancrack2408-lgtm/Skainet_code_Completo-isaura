import { ProductionLogsService } from './production-logs.service';
export declare class ProductionLogsController {
    private readonly productionLogsService;
    constructor(productionLogsService: ProductionLogsService);
    logPhaseTime(req: any, body: any): Promise<{
        success: boolean;
        message: string;
        timeLog: {
            id: string;
            workOrderId: string;
            jewelerId: string;
            phase: string;
            action: string;
            durationSeconds: number;
            createdAt: Date;
        };
    }>;
    getPhaseTimes(workOrderId: string): Promise<{
        id: string;
        workOrderId: string;
        jewelerId: string;
        phase: string;
        action: string;
        durationSeconds: number;
        createdAt: Date;
    }[]>;
    logTripleWeight(req: any, body: any): Promise<{
        success: boolean;
        message: string;
        weightLog: {
            id: string;
            workOrderId: string;
            jewelerId: string;
            phase: string;
            createdAt: Date;
            weight1: number;
            weight2: number;
            weight3: number;
            lossPercentage: number;
        };
    }>;
    getTripleWeights(workOrderId: string): Promise<{
        id: string;
        workOrderId: string;
        jewelerId: string;
        phase: string;
        createdAt: Date;
        weight1: number;
        weight2: number;
        weight3: number;
        lossPercentage: number;
    }[]>;
}
