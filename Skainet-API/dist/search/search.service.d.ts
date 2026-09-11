import { PrismaService } from '../prisma/prisma.service';
export declare class SearchService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    globalSearch(actorId: string, actorRole: string, term: string, filterModule?: string): Promise<{
        users: any[];
        materials: any[];
        orders: any[];
    }>;
}
