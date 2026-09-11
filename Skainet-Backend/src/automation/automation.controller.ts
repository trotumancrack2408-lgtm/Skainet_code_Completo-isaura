import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AutomationService } from './automation.service';

@ApiTags('Automatización & Worker')
@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @ApiOperation({ summary: 'Obtener estado y métricas del Worker en segundo plano' })
  @Get('status')
  getStatus() {
    return this.automationService.getStatus();
  }

  @ApiOperation({ summary: 'Disparar revisión manual inmediata de stock crítico' })
  @Post('trigger-stock-check')
  async triggerStockCheck() {
    return await this.automationService.checkStockLevels();
  }

  @ApiOperation({ summary: 'Disparar revisión manual inmediata de máquinas láser' })
  @Post('trigger-machine-check')
  async triggerMachineCheck() {
    return await this.automationService.checkMachineMaintenance();
  }

  @ApiOperation({ summary: 'Disparar auditoría manual inmediata de anomalías y mermas' })
  @Post('trigger-anomaly-check')
  async triggerAnomalyCheck() {
    return await this.automationService.checkWeightAnomalies();
  }
}
