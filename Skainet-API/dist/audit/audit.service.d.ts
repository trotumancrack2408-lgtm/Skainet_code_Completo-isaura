import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(actorId: string, action: string, moduleName: string, details: any, actorRole?: string): Promise<{
        id: string;
        actorId: string;
        actorRole: string | null;
        action: string;
        module: string;
        details: string;
        createdAt: Date;
    } | undefined>;
    findAll(): Promise<{
        id: string;
        actorId: string;
        actorRole: string | null;
        action: string;
        module: string;
        details: string;
        createdAt: Date;
    }[]>;
    findByModule(moduleName: string): Promise<{
        id: string;
        actorId: string;
        actorRole: string | null;
        action: string;
        module: string;
        details: string;
        createdAt: Date;
    }[]>;
}
