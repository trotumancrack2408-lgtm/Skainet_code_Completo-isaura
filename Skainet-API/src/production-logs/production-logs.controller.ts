import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ProductionLogsService } from './production-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('ProduccionLogs')
@Controller('production-logs')
export class ProductionLogsController {
  constructor(private readonly productionLogsService: ProductionLogsService) {}

  @Post('timer')
  @UseGuards(JwtAuthGuard)
  async logPhaseTime(@Request() req: any, @Body() body: any) {
    const actorId = req.user?.sub || body.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body.actorRole || 'Joyero';
    return this.productionLogsService.logPhaseTime(actorId, actorRole, body);
  }

  @Get('timer/:workOrderId')
  async getPhaseTimes(@Param('workOrderId') workOrderId: string) {
    return this.productionLogsService.getPhaseTimes(workOrderId);
  }

  @Post('weights')
  @UseGuards(JwtAuthGuard)
  async logTripleWeight(@Request() req: any, @Body() body: any) {
    const actorId = req.user?.sub || body.actorId || 'SISTEMA';
    const actorRole = req.user?.role || body.actorRole || 'Joyero';
    return this.productionLogsService.logTripleWeight(actorId, actorRole, body);
  }

  @Get('weights/:workOrderId')
  async getTripleWeights(@Param('workOrderId') workOrderId: string) {
    return this.productionLogsService.getTripleWeights(workOrderId);
  }
}
