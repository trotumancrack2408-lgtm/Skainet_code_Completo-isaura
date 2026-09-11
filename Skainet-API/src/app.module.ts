import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { BatchesModule } from './batches/batches.module';
import { OrdersModule } from './orders/orders.module';
import { ClientOrdersModule } from './client-orders/client-orders.module';
import { AlertsModule } from './alerts/alerts.module';
import { StatsModule } from './stats/stats.module';
import { MachinesModule } from './machines/machines.module';
import { RecoveryModule } from './recovery/recovery.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductionLogsModule } from './production-logs/production-logs.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule, 
    BatchesModule, 
    OrdersModule, 
    ClientOrdersModule, 
    AlertsModule,
    StatsModule,
    MachinesModule,
    RecoveryModule,
    NotificationsModule,
    AuthModule,
    AuditModule,
    InventoryModule,
    ProductionLogsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
