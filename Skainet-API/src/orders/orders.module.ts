import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { BatchesModule } from '../batches/batches.module';
import { AlertsModule } from '../alerts/alerts.module';

import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

import { RecoveryModule } from '../recovery/recovery.module';

@Module({
  imports: [UsersModule, BatchesModule, AlertsModule, RecoveryModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService]
})
export class OrdersModule {}
