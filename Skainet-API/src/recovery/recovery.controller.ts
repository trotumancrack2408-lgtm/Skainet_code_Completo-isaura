import { Controller, Get, Post, Body } from '@nestjs/common';
import { RecoveryService } from './recovery.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Recuperación de material')
@Controller('recovery')
export class RecoveryController {
  constructor(private readonly recoveryService: RecoveryService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Consultar indicadores de recuperación de material' })
  getStats() {
    return this.recoveryService.getStats();
  }

  @Post('refine')
  @ApiOperation({ summary: 'Registrar refinamiento y oro recuperado de residuos' })
  refine(@Body() data: { inputWeight: number; recoveredPureGold: number }) {
    return this.recoveryService.refineResidues(data.inputWeight, data.recoveredPureGold);
  }
}
