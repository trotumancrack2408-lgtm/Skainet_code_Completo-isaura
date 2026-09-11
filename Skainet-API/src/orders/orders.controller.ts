import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { OrdersService, OrderWeights } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() data: {
    ringId: string;
    receiverId: string;
    executorId: string;
    weights: OrderWeights;
    providedPin?: string;
  }) {
    return this.ordersService.create(data);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('active/:executorId')
  findActive(@Param('executorId') executorId: string) {
    return this.ordersService.findActiveByExecutor(executorId);
  }

  @Post(':id/close')
  close(
    @Param('id') id: string, 
    @Body() body: { weights: OrderWeights; explanation?: string; providedPin?: string }
  ) {
    return this.ordersService.closeOrder(id, body.weights, body.explanation, body.providedPin);
  }
}
