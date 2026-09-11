import { Module } from '@nestjs/common';
import { ProductionLogsService } from './production-logs.service';
import { ProductionLogsController } from './production-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [ProductionLogsService],
  controllers: [ProductionLogsController],
  exports: [ProductionLogsService],
})
export class ProductionLogsModule {}
