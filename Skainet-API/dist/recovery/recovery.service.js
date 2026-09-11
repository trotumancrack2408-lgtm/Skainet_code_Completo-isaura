"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryService = void 0;
const common_1 = require("@nestjs/common");
let RecoveryService = class RecoveryService {
    recoveryStats = {
        totalWasteAccumulated: 0,
        estimatedPureGoldInWaste: 0,
        history: []
    };
    getStats() {
        return this.recoveryStats;
    }
    addWaste(weight, orderId) {
        this.recoveryStats.totalWasteAccumulated += weight;
        this.recoveryStats.history.push({
            type: 'ENTRY',
            amount: weight,
            orderId,
            timestamp: new Date()
        });
    }
    refineResidues(inputWeight, recoveredPureGold) {
        if (inputWeight > this.recoveryStats.totalWasteAccumulated) {
            throw new Error('No puedes fundir más residuos de los que tienes registrados');
        }
        const efficiency = (recoveredPureGold / inputWeight) * 100;
        this.recoveryStats.totalWasteAccumulated -= inputWeight;
        const refiningLog = {
            type: 'REFINING',
            inputWeight,
            recoveredPureGold,
            efficiency,
            timestamp: new Date()
        };
        this.recoveryStats.history.push(refiningLog);
        return refiningLog;
    }
};
exports.RecoveryService = RecoveryService;
exports.RecoveryService = RecoveryService = __decorate([
    (0, common_1.Injectable)()
], RecoveryService);
//# sourceMappingURL=recovery.service.js.map