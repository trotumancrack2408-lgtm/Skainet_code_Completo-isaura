import { Module } from '@nestjs/common';
import { ClientOrdersService } from './client-orders.service';
import { ClientOrdersController } from './client-orders.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ClientOrdersController],
  providers: [ClientOrdersService],
  exports: [ClientOrdersService],
})
export class ClientOrdersModule {}
