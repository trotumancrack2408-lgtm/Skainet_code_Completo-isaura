import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OrdersService, OrderWeights } from './orders.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Órdenes de producción')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una orden de producción y asignarla a un joyero' })
  create(@Body() data: {
    productionItemId: string;
    receiverId: string;
    executorId: string;
    weights: OrderWeights;
    providedPin?: string;
  }) {
    return this.ordersService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar órdenes de producción' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('active/:executorId')
  @ApiOperation({ summary: 'Consultar órdenes activas de un ejecutor' })
  findActive(@Param('executorId') executorId: string) {
    return this.ordersService.findActiveByExecutor(executorId);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Cerrar una orden y registrar pesos finales' })
  close(
    @Param('id') id: string, 
    @Body() body: { weights: OrderWeights; explanation?: string; providedPin?: string }
  ) {
    return this.ordersService.closeOrder(id, body.weights, body.explanation, body.providedPin);
  }
}
