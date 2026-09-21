import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Indicadores')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar indicadores generales del taller' })
  getStats() {
    return this.statsService.getGeneralStats();
  }
}
