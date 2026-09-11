import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class ProductionLogsService {
    private readonly prisma;
    private readonly auditService?;
    constructor(prisma: PrismaService, auditService?: AuditService | undefined);
    logPhaseTime(actorId: string, actorRole: string, data: {
        workOrderId: string;
        phase: string;
        action: 'Iniciar' | 'Pausar' | 'Reanudar' | 'Finalizar';
        durationSeconds?: number;
    }): Promise<{
        success: boolean;
        message: string;
        timeLog: {
            id: string;
            workOrderId: string;
            jewelerId: string;
            phase: string;
            action: string;
            durationSeconds: number;
            createdAt: Date;
        };
    }>;
    getPhaseTimes(workOrderId: string): Promise<{
        id: string;
        workOrderId: string;
        jewelerId: string;
        phase: string;
        action: string;
        durationSeconds: number;
        createdAt: Date;
    }[]>;
    logTripleWeight(actorId: string, actorRole: string, data: {
        workOrderId: string;
        phase: string;
        weight1: number;
        weight2: number;
        weight3: number;
    }): Promise<{
        success: boolean;
        message: string;
        weightLog: {
            id: string;
            workOrderId: string;
            jewelerId: string;
            phase: string;
            createdAt: Date;
            weight1: number;
            weight2: number;
            weight3: number;
            lossPercentage: number;
        };
    }>;
    getTripleWeights(workOrderId: string): Promise<{
        id: string;
        workOrderId: string;
        jewelerId: string;
        phase: string;
        createdAt: Date;
        weight1: number;
        weight2: number;
        weight3: number;
        lossPercentage: number;
    }[]>;
}
