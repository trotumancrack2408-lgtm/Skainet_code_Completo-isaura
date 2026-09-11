import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

export interface Alert {
  id: string;
  type: 'WEIGHT' | 'TIME' | 'SECURITY' | string;
  severity: 'CRITICAL' | 'WARNING' | string;
  message: string;
  timestamp: Date;
  orderId?: string | null;
  jewelerName: string;
}

@Injectable()
export class AlertsService implements OnModuleInit {
  private readonly logger = new Logger('VigilanteDigital');

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const count = await this.prisma.alert.count();
    if (count === 0) {
      this.logger.log('Seeding initial alerts...');
      await this.prisma.alert.createMany({
        data: [
          {
            id: 'ALT-101',
            type: 'WEIGHT',
            severity: 'CRITICAL',
            jewelerName: 'Plata',
            message: 'PÉRDIDA CRÍTICA: Se detectó merma de 0.12g (0.8%) en la pieza Anillo 3 (Lote B-101).',
            orderId: 'ORD-103',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
          },
          {
            id: 'ALT-102',
            type: 'TIME',
            severity: 'WARNING',
            jewelerName: 'Ramiro',
            message: 'TIEMPO EXCEDIDO: El joyero lleva 125 min con la pieza Anillo 1 (Lote B-101).',
            orderId: 'ORD-101',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
          },
        ],
      });
    }
  }

  async createAlert(data: Omit<Alert, 'id' | 'timestamp'>) {
    const newAlert = await this.prisma.alert.create({
      data: {
        type: data.type,
        severity: data.severity,
        message: data.message,
        jewelerName: data.jewelerName,
        orderId: data.orderId || null,
      },
    });

    this.sendNotifications(newAlert);
    return newAlert;
  }

  async findAll(): Promise<Alert[]> {
    return this.prisma.alert.findMany({
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  private async sendNotifications(alert: any) {
    const icon = alert.severity === 'CRITICAL' ? '🚨' : '⚠️';
    const message = `${icon} ALERTA SKYNET: ${alert.message} | Joyero: ${alert.jewelerName}`;
    
    // Notificar a administración/dueño directamente al celular
    await this.notificationsService.notifyAdmins(message);
    
    this.logger.log(`[ALERTA PROCESADA] Notificación enviada a administración.`);
  }
}

