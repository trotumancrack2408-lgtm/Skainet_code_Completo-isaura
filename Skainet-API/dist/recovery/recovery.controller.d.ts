import { RecoveryService } from './recovery.service';
export declare class RecoveryController {
    private readonly recoveryService;
    constructor(recoveryService: RecoveryService);
    getStats(): {
        totalWasteAccumulated: number;
        estimatedPureGoldInWaste: number;
        history: import("./recovery.service").RecoveryHistoryEntry[];
    };
    refine(data: {
        inputWeight: number;
        recoveredPureGold: number;
    }): import("./recovery.service").RecoveryHistoryEntry;
}
