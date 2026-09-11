import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(actorId: string, action: string, moduleName: string, details: any, actorRole?: string) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: actorId || 'SISTEMA',
          actorRole: actorRole || 'Desconocido',
          action,
          module: moduleName,
          details: typeof details === 'string' ? details : JSON.stringify(details),
        },
      });
    } catch (err) {
      console.error('Error guardando registro de auditoría:', err);
    }
  }

  async findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByModule(moduleName: string) {
    return this.prisma.auditLog.findMany({
      where: { module: moduleName },
      orderBy: { createdAt: 'desc' },
    });
  }
}
