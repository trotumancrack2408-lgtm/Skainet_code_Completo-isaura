import { Controller, Get, Post, Body } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Lotes')
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  create(@Body() data: { entryWeight: number; exitWeight: number; ringsCount: number }) {
    return this.batchesService.create(data.entryWeight, data.exitWeight, data.ringsCount);
  }

  @Get()
  findAll() {
    return this.batchesService.findAll();
  }

  @Get('pending-rings')
  findPendingRings() {
    return this.batchesService.findPendingRings();
  }
}
