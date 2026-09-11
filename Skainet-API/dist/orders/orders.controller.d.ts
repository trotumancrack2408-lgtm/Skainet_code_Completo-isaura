import { OrdersService, OrderWeights } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(data: {
        ringId: string;
        receiverId: string;
        executorId: string;
        weights: OrderWeights;
        providedPin?: string;
    }): Promise<any>;
    findAll(): Promise<any[]>;
    findActive(executorId: string): Promise<any>;
    close(id: string, body: {
        weights: OrderWeights;
        explanation?: string;
        providedPin?: string;
    }): Promise<any>;
}
