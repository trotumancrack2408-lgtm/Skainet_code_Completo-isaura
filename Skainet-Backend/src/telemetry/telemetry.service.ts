import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordScaleWeight(data: { scaleId: string; jewelerId: string; workOrderId?: string; phase: string; weight: number }) {
    this.logger.log(`Lectura recibida de báscula [${data.scaleId}]: ${data.weight}g por joyero ${data.jewelerId}`);
    
    await this.prisma.auditLog.create({
      data: {
        actorId: data.jewelerId,
        actorRole: 'TELEMETRIA_BASCULA',
        action: 'PESAJE_DIGITAL',
        module: 'TELEMETRY',
        details: JSON.stringify(data),
      },
    });

    return {
      success: true,
      deviceId: data.scaleId,
      registeredWeight: data.weight,
      timestamp: new Date(),
    };
  }

  async recordLaserTelemetry(data: { machineId: string; cyclesExecuted: number; durationSeconds: number }) {
    this.logger.log(`Telemetría recibida de máquina láser [${data.machineId}]: +${data.cyclesExecuted} ciclos`);

    const machine = await this.prisma.machine.findUnique({
      where: { id: data.machineId },
    });

    if (machine) {
      const updated = await this.prisma.machine.update({
        where: { id: data.machineId },
        data: {
          cycleCount: machine.cycleCount + data.cyclesExecuted,
        },
      });

      return {
        success: true,
        machineId: data.machineId,
        totalCycles: updated.cycleCount,
        maintenanceRequired: updated.cycleCount >= updated.maintenanceThreshold,
      };
    }

    return { success: false, message: 'Máquina no encontrada' };
  }

  getConnectedDevices() {
    return [
      { id: 'SCALE-KERN-01', name: 'Báscula Analítica Kern (Mesa 1)', status: 'ONLINE', protocol: 'RS232/USB' },
      { id: 'SCALE-KERN-02', name: 'Báscula Analítica Kern (Mesa 2)', status: 'ONLINE', protocol: 'RS232/USB' },
      { id: 'LASER-FIBER-01', name: 'Grabadora Láser Fibra 50W', status: 'STANDBY', protocol: 'TCP/IP' },
      { id: 'LASER-WELD-01', name: 'Soldadora Láser Nd:YAG', status: 'OPERATIONAL', protocol: 'TCP/IP' },
    ];
  }
}
