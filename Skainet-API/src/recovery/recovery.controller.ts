import { Controller, Get, Post, Body } from '@nestjs/common';
import { RecoveryService } from './recovery.service';

@Controller('recovery')
export class RecoveryController {
  constructor(private readonly recoveryService: RecoveryService) {}

  @Get('stats')
  getStats() {
    return this.recoveryService.getStats();
  }

  @Post('refine')
  refine(@Body() data: { inputWeight: number; recoveredPureGold: number }) {
    return this.recoveryService.refineResidues(data.inputWeight, data.recoveredPureGold);
  }
}
