import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ClientOrdersService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  async onModuleInit() {
    const count = await this.prisma.clientOrder.count();
    if (count === 0) {
      await this.prisma.clientOrder.createMany({
        data: [
          {
            shortId: '9845',
            clientName: 'Marcela Gómez',
            email: 'marcela@example.com',
            phone: '+573001234567',
            design: 'Anillo de Compromiso Oro Blanco 18k',
            estimatedWeight: 8.5,
            status: 'En Espera',
            stepIndex: 0
          },
          {
            shortId: '4312',
            clientName: 'Andrés Felipe',
            email: 'andres@example.com',
            phone: '+573007654321',
            design: 'Argollas de Matrimonio Clásicas',
            estimatedWeight: 14.2,
            status: 'En Proceso',
            stepIndex: 2
          }
        ]
      });
      console.log('Seed client orders completed successfully! 📦');
    }
  }

  async findAll() {
    return this.prisma.clientOrder.findMany();
  }

  async create(name: string, design: string, weight: number, email?: string, phone?: string) {
    const shortId = Math.floor(1000 + Math.random() * 9000).toString();
    const newOrder = await this.prisma.clientOrder.create({
      data: {
        shortId,
        clientName: name,
        email,
        phone,
        design,
        estimatedWeight: weight,
        status: 'En Espera',
        stepIndex: 0
      }
    });

    if (phone) {
      this.notificationsService.notifyClient(phone, name, shortId);
    }

    return newOrder;
  }

  async updateStatus(shortId: string, status: string, stepIndex?: number) {
    const data: any = { status };
    if (stepIndex !== undefined) data.stepIndex = stepIndex;

    return this.prisma.clientOrder.update({
      where: { shortId },
      data
    });
  }
}
