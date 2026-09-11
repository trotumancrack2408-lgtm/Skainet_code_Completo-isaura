export interface RecoveryHistoryEntry {
    type: 'ENTRY' | 'REFINING';
    amount?: number;
    inputWeight?: number;
    recoveredPureGold?: number;
    efficiency?: number;
    orderId?: string;
    timestamp: Date;
}
export declare class RecoveryService {
    private recoveryStats;
    getStats(): {
        totalWasteAccumulated: number;
        estimatedPureGoldInWaste: number;
        history: RecoveryHistoryEntry[];
    };
    addWaste(weight: number, orderId: string): void;
    refineResidues(inputWeight: number, recoveredPureGold: number): RecoveryHistoryEntry;
}
