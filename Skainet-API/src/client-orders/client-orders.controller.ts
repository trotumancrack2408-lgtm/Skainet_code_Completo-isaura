import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ClientOrdersService } from './client-orders.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Pedidos de clientes')
@Controller('client-orders')
export class ClientOrdersController {
  constructor(private readonly clientOrdersService: ClientOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pedidos de clientes' })
  findAll() {
    return this.clientOrdersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un pedido de cliente' })
  create(@Body() body: { clientName: string; design: string; estimatedWeight: number; email?: string; phone?: string }) {
    return this.clientOrdersService.create(body.clientName, body.design, body.estimatedWeight, body.email, body.phone);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar el estado o avance de un pedido' })
  updateStatus(@Param('id') id: string, @Body() body: { status: 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED', stepIndex?: number }) {
    return this.clientOrdersService.updateStatus(id, body.status, body.stepIndex);
  }
}
