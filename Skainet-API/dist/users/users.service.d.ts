import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare enum UserRole {
    SUPER_ADMIN = "Super Administrador",
    ADMIN = "Administrador",
    JOYERO = "Joyero",
    DUENO = "Super Administrador",
    LIDER = "Lider de Taller"
}
export declare enum UserStatus {
    OFFLINE = "Fuera de Turno",
    AVAILABLE = "Disponible",
    WORKING = "En Proceso",
    PAUSED = "En Pausa"
}
export declare enum AccountStatus {
    ACTIVE = "Activo",
    INACTIVE = "Inactivo"
}
export declare class UsersService implements OnModuleInit {
    private readonly prisma;
    private readonly auditService?;
    constructor(prisma: PrismaService, auditService?: AuditService | undefined);
    onModuleInit(): Promise<void>;
    findAll(roleFilter?: string, accountStatusFilter?: string): Promise<any[]>;
    findOne(id: string): Promise<any>;
    findByIdWithPassword(id: string): Promise<any>;
    createUser(actorId: string, actorRole: string, data: any): Promise<any>;
    updateUser(actorId: string, actorRole: string, idToUpdate: string, data: any): Promise<any>;
    deactivateUser(actorId: string, actorRole: string, idToDeactivate: string): Promise<any>;
    changePassword(userId: string, oldPass: string, newPass: string): Promise<any>;
    resetPasswordByAdmin(actorId: string, actorRole: string, targetUserId: string): Promise<{
        success: boolean;
        tempPassword: string;
    }>;
    updateStatus(id: string, status: UserStatus): Promise<any>;
    updateShiftStatus(id: string, status: UserStatus): Promise<any>;
    validatePassword(id: string, pass: string): Promise<any>;
    create(data: any): Promise<any>;
    validateRecovery(id: string, answers: string[]): Promise<any>;
}
