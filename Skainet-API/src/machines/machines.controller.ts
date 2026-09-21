import { Controller, Get, Post, Param, Body, Patch } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Maquinaria')
@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar máquinas y su estado operativo' })
  findAll() {
    return this.machinesService.findAll();
  }

  @Post(':id/cycle')
  @ApiOperation({ summary: 'Registrar un ciclo de operación de una máquina' })
  increment(@Param('id') id: string) {
    return this.machinesService.incrementCycles(id);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Reportar una novedad o falla de máquina' })
  report(@Param('id') id: string, @Body('issue') issue: string) {
    return this.machinesService.reportIssue(id, issue);
  }

  @Patch(':id/fix')
  @ApiOperation({ summary: 'Marcar una máquina como operativa' })
  fix(@Param('id') id: string) {
    return this.machinesService.setOperational(id);
  }
}
