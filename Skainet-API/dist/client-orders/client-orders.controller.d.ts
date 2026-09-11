import { ClientOrdersService } from './client-orders.service';
export declare class ClientOrdersController {
    private readonly clientOrdersService;
    constructor(clientOrdersService: ClientOrdersService);
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
    create(body: {
        clientName: string;
        design: string;
        estimatedWeight: number;
        email?: string;
        phone?: string;
    }): Promise<{
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
    updateStatus(id: string, body: {
        status: 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED';
        stepIndex?: number;
    }): Promise<{
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
