import { UsersService, UserStatus } from './users.service';
import { AuthService } from '../auth/auth.service';
export declare class UsersController {
    private readonly usersService;
    private readonly authService;
    constructor(usersService: UsersService, authService: AuthService);
    findAll(role?: string, accountStatus?: string): Promise<any[]>;
    findOne(id: string): Promise<any>;
    login(body: {
        id: string;
        password: string;
    }): Promise<any>;
    changePassword(body: {
        userId: string;
        oldPass: string;
        newPass: string;
    }): Promise<any>;
    resetPassword(id: string, req: any): Promise<{
        success: boolean;
        tempPassword: string;
    }>;
    create(body: any, req: any): Promise<any>;
    update(id: string, body: any, req: any): Promise<any>;
    remove(id: string, req: any, body: any): Promise<any>;
    updateShiftStatus(id: string, status: UserStatus): Promise<any>;
}
