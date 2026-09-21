import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ProductionLogsService } from './production-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('ProduccionLogs')
@Controller('production-logs')
export class ProductionLogsController {
  constructor(private readonly productionLogsService: ProductionLogsService) {}

  @Post('timer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar tiempo consumido en una fase de producción' })
  async logPhaseTime(@Request() req: any, @Body() body: any) {
    const actorId = req.user?.sub || body.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body.actorRole || 'Joyero';
    return this.productionLogsService.logPhaseTime(actorId, actorRole, body);
  }

  @Get('timer/:workOrderId')
  @ApiOperation({ summary: 'Consultar tiempos registrados de una orden' })
  async getPhaseTimes(@Param('workOrderId') workOrderId: string) {
    return this.productionLogsService.getPhaseTimes(workOrderId);
  }

  @Post('weights')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar pesaje de control de una orden' })
  async logTripleWeight(@Request() req: any, @Body() body: any) {
    const actorId = req.user?.sub || body.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body.actorRole || 'Joyero';
    return this.productionLogsService.logTripleWeight(actorId, actorRole, body);
  }

  @Get('weights/:workOrderId')
  @ApiOperation({ summary: 'Consultar pesajes de control de una orden' })
  async getTripleWeights(@Param('workOrderId') workOrderId: string) {
    return this.productionLogsService.getTripleWeights(workOrderId);
  }
}
