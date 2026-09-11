import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [OrdersModule, UsersModule, AlertsModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
