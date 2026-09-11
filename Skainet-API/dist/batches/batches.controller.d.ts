import { BatchesService } from './batches.service';
export declare class BatchesController {
    private readonly batchesService;
    constructor(batchesService: BatchesService);
    create(data: {
        entryWeight: number;
        exitWeight: number;
        ringsCount: number;
    }): Promise<{
        rings: {
            id: string;
            createdAt: Date;
            name: string;
            status: string;
            securePin: string;
            batchId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        entryWeight: number;
        exitWeight: number;
        ringsCount: number;
    }>;
    findAll(): Promise<({
        rings: {
            id: string;
            createdAt: Date;
            name: string;
            status: string;
            securePin: string;
            batchId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        entryWeight: number;
        exitWeight: number;
        ringsCount: number;
    })[]>;
    findPendingRings(): Promise<any[]>;
}
