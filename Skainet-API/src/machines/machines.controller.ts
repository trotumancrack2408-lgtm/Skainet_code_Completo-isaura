import { Controller, Get, Post, Param, Body, Patch } from '@nestjs/common';
import { MachinesService } from './machines.service';

@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  findAll() {
    return this.machinesService.findAll();
  }

  @Post(':id/cycle')
  increment(@Param('id') id: string) {
    return this.machinesService.incrementCycles(id);
  }

  @Post(':id/report')
  report(@Param('id') id: string, @Body('issue') issue: string) {
    return this.machinesService.reportIssue(id, issue);
  }

  @Patch(':id/fix')
  fix(@Param('id') id: string) {
    return this.machinesService.setOperational(id);
  }
}
