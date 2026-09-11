import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutomationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationService.name);
  private stockTimer: NodeJS.Timeout | null = null;
  private machineTimer: NodeJS.Timeout | null = null;
  private anomalyTimer: NodeJS.Timeout | null = null;
  private startTime: Date = new Date();
  private lastStockCheck: Date | null = null;
  private lastMachineCheck: Date | null = null;
  private lastAnomalyCheck: Date | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log('Iniciando Motor de Automatización y Tareas en Segundo Plano (Skainet Backend Worker)...');
    
    // Iniciar monitor de stock cada 60 segundos
    this.stockTimer = setInterval(() => this.checkStockLevels(), 60000);
    // Iniciar monitor de máquinas cada 90 segundos
    this.machineTimer = setInterval(() => this.checkMachineMaintenance(), 90000);
    // Iniciar auditor de mermas y anomalías cada 45 segundos
    this.anomalyTimer = setInterval(() => this.checkWeightAnomalies(), 45000);

    // Ejecución inicial después de 5 segundos
    setTimeout(() => {
      this.checkStockLevels();
      this.checkMachineMaintenance();
      this.checkWeightAnomalies();
    }, 5000);
  }

  onModuleDestroy() {
    if (this.stockTimer) clearInterval(this.stockTimer);
    if (this.machineTimer) clearInterval(this.machineTimer);
    if (this.anomalyTimer) clearInterval(this.anomalyTimer);
    this.logger.log('Deteniendo tareas en segundo plano del Backend Worker.');
  }

  async checkStockLevels() {
    this.lastStockCheck = new Date();
    try {
      const materials = await this.prisma.material.findMany({
        where: { status: 'Activo' },
      });

      let lowCount = 0;
      for (const mat of materials) {
        if (mat.stock <= mat.minStock) {
          lowCount++;
          const existingAlert = await this.prisma.alert.findFirst({
            where: {
              type: 'STOCK_CRITICO',
              message: { contains: mat.name },
            },
          });

          if (!existingAlert) {
            await this.prisma.alert.create({
              data: {
                type: 'STOCK_CRITICO',
                message: `Stock crítico para el material: ${mat.name}. Stock actual: ${mat.stock} ${mat.unit} (Mínimo requerido: ${mat.minStock})`,
                severity: 'CRITICAL',
                jewelerName: 'SISTEMA_AUTOMATIZACION',
              },
            });
            this.logger.warn(`Alerta automática generada: Stock crítico en ${mat.name}`);
          }
        }
      }
      return { checkedMaterials: materials.length, lowStockCount: lowCount, timestamp: this.lastStockCheck };
    } catch (error) {
      this.logger.error('Error al verificar niveles de stock:', error);
      return { error: String(error) };
    }
  }

  async checkMachineMaintenance() {
    this.lastMachineCheck = new Date();
    try {
      const machines = await this.prisma.machine.findMany();
      let alertsCreated = 0;

      for (const machine of machines) {
        if (machine.cycleCount >= machine.maintenanceThreshold) {
          const existingAlert = await this.prisma.alert.findFirst({
            where: {
              type: 'MANTENIMIENTO_MAQUINA',
              message: { contains: machine.name },
            },
          });

          if (!existingAlert) {
            await this.prisma.alert.create({
              data: {
                type: 'MANTENIMIENTO_MAQUINA',
                message: `Mantenimiento preventivo requerido: ${machine.name}. Ciclos completados: ${machine.cycleCount}/${machine.maintenanceThreshold}`,
                severity: 'WARNING',
                jewelerName: 'SISTEMA_AUTOMATIZACION',
              },
            });
            alertsCreated++;
            this.logger.warn(`Alerta de mantenimiento generada para la máquina: ${machine.name}`);
          }
        }
      }
      return { totalMachines: machines.length, alertsCreated, timestamp: this.lastMachineCheck };
    } catch (error) {
      this.logger.error('Error al verificar mantenimiento de máquinas:', error);
      return { error: String(error) };
    }
  }

  async checkWeightAnomalies() {
    this.lastAnomalyCheck = new Date();
    try {
      const highLossLogs = await this.prisma.tripleWeightLog.findMany({
        where: {
          lossPercentage: { gt: 2.5 },
        },
      });

      let updatedOrders = 0;
      for (const log of highLossLogs) {
        if (log.workOrderId) {
          const order = await this.prisma.workOrder.findUnique({
            where: { id: log.workOrderId },
          });

          if (order && !order.isAnomaly) {
            await this.prisma.workOrder.update({
              where: { id: log.workOrderId },
              data: {
                isAnomaly: true,
                explanation: `Merma detectada automáticamente: ${log.lossPercentage}% en fase ${log.phase}`,
              },
            });

            await this.prisma.alert.create({
              data: {
                type: 'ANOMALIA_MERMA',
                message: `Anomalía de pérdida excesiva (${log.lossPercentage}%) en orden ${log.workOrderId} (Fase: ${log.phase})`,
                severity: 'CRITICAL',
                orderId: log.workOrderId,
                jewelerName: log.jewelerId || 'Desconocido',
              },
            });
            updatedOrders++;
            this.logger.warn(`Anomalía registrada en orden ${log.workOrderId}`);
          }
        }
      }
      return { anomaliesFound: highLossLogs.length, updatedOrders, timestamp: this.lastAnomalyCheck };
    } catch (error) {
      this.logger.error('Error al verificar anomalías de peso:', error);
      return { error: String(error) };
    }
  }

  getStatus() {
    return {
      status: 'ONLINE',
      service: 'Skainet Backend Worker & Automation Engine',
      port: 3001,
      startTime: this.startTime,
      uptimeSeconds: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
      monitors: {
        stock: { intervalSeconds: 60, lastRun: this.lastStockCheck },
        machines: { intervalSeconds: 90, lastRun: this.lastMachineCheck },
        anomalies: { intervalSeconds: 45, lastRun: this.lastAnomalyCheck },
      },
    };
  }
}
