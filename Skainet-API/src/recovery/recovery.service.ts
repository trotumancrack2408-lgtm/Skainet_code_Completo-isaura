import { Injectable } from '@nestjs/common';

export interface RecoveryHistoryEntry {
  type: 'ENTRY' | 'REFINING';
  amount?: number;
  inputWeight?: number;
  recoveredPureGold?: number;
  efficiency?: number;
  orderId?: string;
  timestamp: Date;
}

@Injectable()
export class RecoveryService {
  private recoveryStats: {
    totalWasteAccumulated: number;
    estimatedPureGoldInWaste: number;
    history: RecoveryHistoryEntry[];
  } = {
    totalWasteAccumulated: 0,
    estimatedPureGoldInWaste: 0,
    history: []
  };

  getStats() {
    return this.recoveryStats;
  }

  addWaste(weight: number, orderId: string) {
    this.recoveryStats.totalWasteAccumulated += weight;
    this.recoveryStats.history.push({
      type: 'ENTRY',
      amount: weight,
      orderId,
      timestamp: new Date()
    });
  }

  refineResidues(inputWeight: number, recoveredPureGold: number) {
    if (inputWeight > this.recoveryStats.totalWasteAccumulated) {
      throw new Error('No puedes fundir más residuos de los que tienes registrados');
    }

    const efficiency = (recoveredPureGold / inputWeight) * 100;
    this.recoveryStats.totalWasteAccumulated -= inputWeight;
    
    const refiningLog: RecoveryHistoryEntry = {
      type: 'REFINING',
      inputWeight,
      recoveredPureGold,
      efficiency,
      timestamp: new Date()
    };
    
    this.recoveryStats.history.push(refiningLog);
    return refiningLog;
  }
}
