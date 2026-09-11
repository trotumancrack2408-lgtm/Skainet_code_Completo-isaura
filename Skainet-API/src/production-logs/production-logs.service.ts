import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProductionLogsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  // RF-006 Cronometría de tiempos por fase
  async logPhaseTime(actorId: string, actorRole: string, data: { workOrderId: string; phase: string; action: 'Iniciar' | 'Pausar' | 'Reanudar' | 'Finalizar'; durationSeconds?: number }) {
    if (!data.workOrderId || !data.phase || !data.action) {
      throw new BadRequestException('Faltan parámetros requeridos para la cronometría.');
    }

    const validPhases = ['diseño', 'impresión', 'embutido', 'fundición', 'pulido', 'terminado', 'engaste'];
    if (!validPhases.includes(data.phase.toLowerCase())) {
      throw new BadRequestException(`Fase no válida. Fases permitidas: ${validPhases.join(', ')}`);
    }

    const timeLog = await this.prisma.phaseTimeLog.create({
      data: {
        workOrderId: data.workOrderId,
        jewelerId: actorId,
        phase: data.phase.toLowerCase(),
        action: data.action,
        durationSeconds: Math.max(0, Number(data.durationSeconds || 0)),
      },
    });

    if (this.auditService?.log) {
      await this.auditService.log(
        actorId,
        `CRONOMETRIA_${data.action.toUpperCase()}`,
        'Produccion',
        { workOrderId: data.workOrderId, phase: data.phase, action: data.action, durationSeconds: timeLog.durationSeconds },
        actorRole,
      );
    }

    return {
      success: true,
      message: data.action === 'Iniciar' ? 'Cronómetro iniciado para la fase seleccionada.' : `Fase ${data.action.toLowerCase()}da.`,
      timeLog,
    };
  }

  async getPhaseTimes(workOrderId: string) {
    return this.prisma.phaseTimeLog.findMany({
      where: { workOrderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // RF-007 Registro de Pesaje por Triple Factor
  async logTripleWeight(actorId: string, actorRole: string, data: { workOrderId: string; phase: string; weight1: number; weight2: number; weight3: number }) {
    const w1 = Number(data.weight1);
    const w2 = Number(data.weight2);
    const w3 = Number(data.weight3);

    if (isNaN(w1) || isNaN(w2) || isNaN(w3) || w1 <= 0 || w2 <= 0 || w3 <= 0) {
      throw new BadRequestException('Los tres pesos deben ser valores numéricos válidos mayores a cero.');
    }

    // Verificar margen de tolerancia entre las capturas del pesaje (ej. max 0.05g de tolerancia)
    const maxDiff = Math.max(Math.abs(w1 - w2), Math.abs(w2 - w3), Math.abs(w1 - w3));
    if (maxDiff > 0.1) {
      throw new BadRequestException('Se detectó una discrepancia entre los tres pesos capturados. Se requiere validación de un Administrador.');
    }

    // Calcular % de merma entre peso inicial (w1) y peso final procesado (w3)
    const lossPercentage = Number((((w1 - w3) / w1) * 100).toFixed(2));

    const weightLog = await this.prisma.tripleWeightLog.create({
      data: {
        workOrderId: data.workOrderId,
        jewelerId: actorId,
        phase: data.phase || 'pesaje',
        weight1: Number(w1.toFixed(2)),
        weight2: Number(w2.toFixed(2)),
        weight3: Number(w3.toFixed(2)),
        lossPercentage: Math.max(0, lossPercentage),
      },
    });

    if (this.auditService?.log) {
      await this.auditService.log(
        actorId,
        'REGISTRO_PESAJE_TRIPLE',
        'Produccion',
        { workOrderId: data.workOrderId, phase: data.phase, weight1: w1, weight2: w2, weight3: w3, lossPercentage },
        actorRole,
      );
    }

    return {
      success: true,
      message: `Pesaje registrado correctamente. Merma calculada: ${lossPercentage}%.`,
      weightLog,
    };
  }

  async getTripleWeights(workOrderId: string) {
    return this.prisma.tripleWeightLog.findMany({
      where: { workOrderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
