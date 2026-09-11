import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class InventoryService {
    private readonly prisma;
    private readonly auditService?;
    constructor(prisma: PrismaService, auditService?: AuditService | undefined);
    createMaterial(actorId: string, actorRole: string, data: any): Promise<{
        id: string;
        name: string;
        category: string;
        unit: string;
        stock: number;
        minStock: number;
        status: string;
        createdAt: Date;
    }>;
    getMaterials(query?: {
        name?: string;
        category?: string;
        status?: string;
    }): Promise<{
        id: string;
        name: string;
        category: string;
        unit: string;
        stock: number;
        minStock: number;
        status: string;
        createdAt: Date;
    }[]>;
    updateMaterial(actorId: string, actorRole: string, id: string, data: any): Promise<{
        id: string;
        name: string;
        category: string;
        unit: string;
        stock: number;
        minStock: number;
        status: string;
        createdAt: Date;
    }>;
    deactivateMaterial(actorId: string, actorRole: string, id: string): Promise<{
        id: string;
        name: string;
        category: string;
        unit: string;
        stock: number;
        minStock: number;
        status: string;
        createdAt: Date;
    }>;
    registerEntry(actorId: string, actorRole: string, data: {
        materialId: string;
        quantity: number;
        originProvider?: string;
        observations?: string;
    }): Promise<{
        success: boolean;
        message: string;
        movement: {
            id: string;
            createdAt: Date;
            type: string;
            quantity: number;
            originProvider: string | null;
            workOrderId: string | null;
            observations: string | null;
            responsibleId: string;
            materialId: string;
        };
        newStock: number;
    }>;
    registerSalida(actorId: string, actorRole: string, data: {
        materialId: string;
        quantity: number;
        workOrderId: string;
        observations?: string;
    }): Promise<{
        success: boolean;
        message: string;
        movement: {
            id: string;
            createdAt: Date;
            type: string;
            quantity: number;
            originProvider: string | null;
            workOrderId: string | null;
            observations: string | null;
            responsibleId: string;
            materialId: string;
        };
        newStock: number;
    }>;
    getKardex(actorId: string, actorRole: string, query?: {
        materialId?: string;
        type?: string;
    }): Promise<({
        material: {
            id: string;
            name: string;
            category: string;
            unit: string;
            stock: number;
            minStock: number;
            status: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        type: string;
        quantity: number;
        originProvider: string | null;
        workOrderId: string | null;
        observations: string | null;
        responsibleId: string;
        materialId: string;
    })[]>;
}
