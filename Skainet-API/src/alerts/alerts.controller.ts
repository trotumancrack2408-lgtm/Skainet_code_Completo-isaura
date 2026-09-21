import { Controller, Get } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Alertas')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar alertas operativas y de seguridad' })
  findAll() {
    return this.alertsService.findAll();
  }
}
