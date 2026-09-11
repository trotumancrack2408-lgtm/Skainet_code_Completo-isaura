import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getMaterials(name?: string, category?: string, status?: string): Promise<{
        id: string;
        name: string;
        category: string;
        unit: string;
        stock: number;
        minStock: number;
        status: string;
        createdAt: Date;
    }[]>;
    createMaterial(req: any, body: any): Promise<{
        id: string;
        name: string;
        category: string;
        unit: string;
        stock: number;
        minStock: number;
        status: string;
        createdAt: Date;
    }>;
    updateMaterial(id: string, req: any, body: any): Promise<{
        id: string;
        name: string;
        category: string;
        unit: string;
        stock: number;
        minStock: number;
        status: string;
        createdAt: Date;
    }>;
    deactivateMaterial(id: string, req: any, body: any): Promise<{
        id: string;
        name: string;
        category: string;
        unit: string;
        stock: number;
        minStock: number;
        status: string;
        createdAt: Date;
    }>;
    registerEntry(req: any, body: any): Promise<{
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
    registerExit(req: any, body: any): Promise<{
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
    getKardex(req: any, materialId?: string, type?: string): Promise<({
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
