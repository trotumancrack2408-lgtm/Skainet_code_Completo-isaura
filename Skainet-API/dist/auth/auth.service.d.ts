import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService?;
    private readonly prisma?;
    private readonly auditService?;
    constructor(usersService: UsersService, jwtService?: JwtService | undefined, prisma?: PrismaService | undefined, auditService?: AuditService | undefined);
    login(id: string, pass: string): Promise<any>;
}
