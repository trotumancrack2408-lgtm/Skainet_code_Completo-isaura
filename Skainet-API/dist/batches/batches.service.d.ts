import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export interface Ring {
    id: string;
    batchId: string;
    name: string;
    status: string;
    securePin: string;
}
export interface Batch {
    id: string;
    entryWeight: number;
    exitWeight: number;
    ringsCount: number;
    rings: Ring[];
    createdAt: Date;
}
export declare class BatchesService implements OnModuleInit {
    private readonly prisma;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    create(entryWeight: number, exitWeight: number, ringsCount: number): Promise<{
        rings: {
            id: string;
            createdAt: Date;
            name: string;
            status: string;
            securePin: string;
            batchId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        entryWeight: number;
        exitWeight: number;
        ringsCount: number;
    }>;
    findAll(): Promise<({
        rings: {
            id: string;
            createdAt: Date;
            name: string;
            status: string;
            securePin: string;
            batchId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        entryWeight: number;
        exitWeight: number;
        ringsCount: number;
    })[]>;
    findPendingRings(): Promise<any[]>;
    getRingById(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        status: string;
        securePin: string;
        batchId: string;
    } | null>;
    updateRingStatus(id: string, status: string, securePin?: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        status: string;
        securePin: string;
        batchId: string;
    }>;
}
