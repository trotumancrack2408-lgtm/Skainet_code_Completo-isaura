import { UsersService } from '../users/users.service';
export declare class NotificationsService {
    private readonly usersService;
    private readonly logger;
    constructor(usersService: UsersService);
    notifyAdmins(message: string): Promise<void>;
    notifyClient(phone: string, name: string, orderId: string): Promise<void>;
    private simulateWhatsApp;
}
