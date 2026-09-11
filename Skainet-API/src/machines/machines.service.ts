import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class MachinesService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService
  ) {}

  async onModuleInit() {
    const count = await this.prisma.machine.count();
    if (count === 0) {
      await this.prisma.machine.createMany({
        data: [
          { id: 'M-01', name: 'Láser de Marcado Fibra', type: 'LASER', status: 'OPERATIONAL', cycleCount: 420, maintenanceThreshold: 500, lastMaintenance: new Date() },
          { id: 'M-02', name: 'Impresora 3D Chitubox', type: 'PRINTER', status: 'OPERATIONAL', cycleCount: 85, maintenanceThreshold: 100, lastMaintenance: new Date() },
          { id: 'M-03', name: 'Estación Rhino 8', type: 'CAD', status: 'OPERATIONAL', cycleCount: 0, maintenanceThreshold: 1000, lastMaintenance: new Date() },
        ]
      });
      console.log('Seed machines completed successfully! 🛠️');
    }
  }

  async findAll() {
    return this.prisma.machine.findMany();
  }

  async incrementCycles(id: string) {
    const machine = await this.prisma.machine.findUnique({ where: { id } });
    if (machine) {
      const newCycleCount = machine.cycleCount + 1;
      const updated = await this.prisma.machine.update({
        where: { id },
        data: { cycleCount: newCycleCount }
      });

      if (newCycleCount >= machine.maintenanceThreshold) {
        await this.alertsService.createAlert({
          type: 'SECURITY',
          severity: 'WARNING',
          jewelerName: 'SISTEMA SKYNET',
          message: `MANTENIMIENTO REQUERIDO: La máquina ${machine.name} ha alcanzado el límite de ciclos (${newCycleCount}).`,
        });
      }
      return updated;
    }
    return null;
  }

  async reportIssue(id: string, issue: string) {
    const machine = await this.prisma.machine.findUnique({ where: { id } });
    if (machine) {
      const updated = await this.prisma.machine.update({
        where: { id },
        data: { status: 'DOWN' }
      });

      await this.alertsService.createAlert({
        type: 'SECURITY',
        severity: 'CRITICAL',
        jewelerName: 'TALLER',
        message: `FALLO DE MAQUINARIA: ${machine.name} reporta error: ${issue}. Producción detenida en este proceso.`,
      });

      return updated;
    }
    return null;
  }

  async setOperational(id: string) {
    return this.prisma.machine.update({
      where: { id },
      data: {
        status: 'OPERATIONAL',
        cycleCount: 0,
        lastMaintenance: new Date()
      }
    });
  }
}
