import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
import { AlertsService } from '../alerts/alerts.service';
export declare class StatsService {
    private readonly ordersService;
    private readonly usersService;
    private readonly alertsService;
    constructor(ordersService: OrdersService, usersService: UsersService, alertsService: AlertsService);
    getGeneralStats(): Promise<{
        totalLoss: number;
        ranking: {
            name: any;
            avgMinutes: number;
            completedCount: number;
        }[];
        incidentCount: number;
        totalProduced: number;
        activeWork: number;
    }>;
}
