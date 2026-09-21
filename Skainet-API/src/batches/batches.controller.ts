import { Controller, Get, Post, Body } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Lotes')
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un lote de producción' })
  create(@Body() data: { entryWeight: number; exitWeight: number; itemsCount: number; productTypeId: string }) {
    return this.batchesService.create(data.entryWeight, data.exitWeight, data.itemsCount, data.productTypeId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar lotes de producción' })
  findAll() {
    return this.batchesService.findAll();
  }

  @Get('pending-items')
  @ApiOperation({ summary: 'Consultar piezas pendientes de asignación' })
  findPendingItems() {
    return this.batchesService.findPendingItems();
  }

  @Get('product-types')
  @ApiOperation({ summary: 'Listar tipos de producto disponibles' })
  findProductTypes() { return this.batchesService.findProductTypes(); }
}
