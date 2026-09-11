import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ClientOrdersService } from './client-orders.service';

@Controller('client-orders')
export class ClientOrdersController {
  constructor(private readonly clientOrdersService: ClientOrdersService) {}

  @Get()
  findAll() {
    return this.clientOrdersService.findAll();
  }

  @Post()
  create(@Body() body: { clientName: string; design: string; estimatedWeight: number; email?: string; phone?: string }) {
    return this.clientOrdersService.create(body.clientName, body.design, body.estimatedWeight, body.email, body.phone);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED', stepIndex?: number }) {
    return this.clientOrdersService.updateStatus(id, body.status, body.stepIndex);
  }
}
