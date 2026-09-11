import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';

@ApiTags('Telemetría & IoT')
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @ApiOperation({ summary: 'Registrar lectura de báscula de pesaje de precisión' })
  @Post('scale')
  async recordScale(@Body() body: { scaleId: string; jewelerId: string; workOrderId?: string; phase: string; weight: number }) {
    return await this.telemetryService.recordScaleWeight(body);
  }

  @ApiOperation({ summary: 'Registrar telemetría de máquina láser (ciclos de grabado/corte)' })
  @Post('laser')
  async recordLaser(@Body() body: { machineId: string; cyclesExecuted: number; durationSeconds: number }) {
    return await this.telemetryService.recordLaserTelemetry(body);
  }

  @ApiOperation({ summary: 'Listar dispositivos IoT y sensores conectados al taller' })
  @Get('devices')
  getDevices() {
    return this.telemetryService.getConnectedDevices();
  }
}
