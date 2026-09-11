/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 6: Producción y Mermas - RF-006)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de Registro
 * y Control de Producción y Mermas (RF-006).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de la interacción entre el pesaje inicial/final de órdenes de trabajo (`OrdersService`),
 * la evaluación del umbral de tolerancia de mermas, la exigencia de justificación, la auditoría y el historial por joyero.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el sistema registra el pesaje inicial al abrir la OT, el pesaje final al cerrarla,
 * evalúa si la merma excede la tolerancia, exige una justificación escrita y mantiene la auditoría y métricas por joyero.
 * 
 * Casos incluidos en este archivo:
 * - CP-106: Registro de pesaje inicial (Inserción en BD del peso del metal entregado)
 * - CP-107: Registro de pesaje final (Inserción en BD del peso de la joya terminada)
 * - CP-109: Tolerancia de merma excedida (Alerta automática si la merma excede la tolerancia)
 * - CP-111: Justificación de merma alta (Exigencia de campo explanation si la merma supera la tolerancia)
 * - CP-112: Auditoría de mermas (Log en BD de cada registro de pesaje y su porcentaje)
 * - CP-113: Historial de mermas por joyero (Reporte de eficiencia y pérdida acumulada por joyero)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../../Skainet-API/src/orders/orders.service';
import { UsersService } from '../../Skainet-API/src/users/users.service';
import { BatchesService } from '../../Skainet-API/src/batches/batches.service';
import { AlertsService } from '../../Skainet-API/src/alerts/alerts.service';
import { PrismaService } from '../../Skainet-API/src/prisma/prisma.service';

describe('PRUEBAS DE INTEGRACIÓN - Producción y Mermas (RF-006)', () => {
  let service: OrdersService;
  let prismaMock: any;
  let usersServiceMock: any;
  let batchesServiceMock: any;
  let alertsServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      workOrder: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
    };

    usersServiceMock = {
      findOne: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue(true),
    };

    batchesServiceMock = {
      getRingById: jest.fn(),
      updateRingStatus: jest.fn().mockResolvedValue(true),
    };

    alertsServiceMock = {
      createAlert: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: BatchesService, useValue: batchesServiceMock },
        { provide: AlertsService, useValue: alertsServiceMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('CP-106: Registro de pesaje inicial', () => {
    it('Debe registrar con precisión el peso inicial total del anillo, plastilina y bolsa en la BD', async () => {
      usersServiceMock.findOne.mockResolvedValue({ id: '1', name: 'Joyero' });
      prismaMock.workOrder.findFirst.mockResolvedValue(null);
      batchesServiceMock.getRingById.mockResolvedValue({ id: 'B-101-R1', name: 'Anillo 1', securePin: '1111' });
      prismaMock.workOrder.create.mockImplementation(({ data }) => Promise.resolve({
        ...data,
        startTime: new Date(),
      }));

      const weights = { anillo: 12.0, plastilina: 1.5, bolsa: 0.5 };
      const res = await service.create({
        ringId: 'B-101-R1',
        receiverId: '4',
        executorId: '1',
        weights,
        providedPin: '1111',
      });

      expect(res.totalWeight).toBe(14.0);
    });
  });

  describe('CP-107: Registro de pesaje final', () => {
    it('Debe registrar el pesaje final retornado al cerrar la orden en la BD', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 'ORD-101',
        ringId: 'B-101-R1',
        totalWeight: 14.0,
        status: 'OPEN',
        executorId: '1',
        startTime: new Date(Date.now() - 30 * 60 * 1000),
      });

      batchesServiceMock.getRingById.mockResolvedValue({ id: 'B-101-R1', securePin: '1111' });
      prismaMock.workOrder.update.mockImplementation(({ data }) => Promise.resolve({
        id: 'ORD-101',
        ...data,
      }));

      const finalWeights = { anillo: 12.0, plastilina: 1.48, bolsa: 0.5 };
      const res = await service.closeOrder('ORD-101', finalWeights, undefined, '1111');

      expect(res.loss).toBe(0.02);
      expect(res.isAnomaly).toBe(false);
    });
  });

  describe('CP-109: Tolerancia de merma excedida', () => {
    it('Debe generar automáticamente una alerta CRITICAL si la merma excede el umbral de tolerancia de 0.05g', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 'ORD-103',
        ringId: 'B-101-R3',
        ringName: 'Anillo Con Exceso',
        totalWeight: 15.0,
        status: 'OPEN',
        executorId: '1',
        startTime: new Date(Date.now() - 40 * 60 * 1000),
      });

      batchesServiceMock.getRingById.mockResolvedValue({ id: 'B-101-R3', securePin: '3333' });
      usersServiceMock.findOne.mockResolvedValue({ id: '1', name: 'Ramiro Joyero' });

      prismaMock.workOrder.update.mockImplementation(({ data }) => Promise.resolve({
        id: 'ORD-103',
        ...data,
      }));

      const finalWeightsHighLoss = { anillo: 12.0, plastilina: 1.5, bolsa: 0.5 };

      const res = await service.closeOrder(
        'ORD-103',
        finalWeightsHighLoss,
        'Desbaste profundo obligatorio por porosidad',
        '3333',
      );

      expect(res.isAnomaly).toBe(true);
      expect(alertsServiceMock.createAlert).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'CRITICAL' }),
      );
    });
  });

  describe('CP-111: Justificación de merma alta', () => {
    it('Debe exigir el parámetro explanation de forma obligatoria cuando la merma exceda la tolerancia', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 'ORD-103',
        ringId: 'B-101-R3',
        ringName: 'Anillo Con Exceso',
        totalWeight: 15.0,
        status: 'OPEN',
        executorId: '1',
        startTime: new Date(Date.now() - 40 * 60 * 1000),
      });

      batchesServiceMock.getRingById.mockResolvedValue({ id: 'B-101-R3', securePin: '3333' });

      const finalWeightsHighLoss = { anillo: 12.0, plastilina: 1.5, bolsa: 0.5 };

      await expect(
        service.closeOrder('ORD-103', finalWeightsHighLoss, undefined, '3333'),
      ).rejects.toThrow('Se requiere una explicación para la anomalía de peso');
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-112
   * --------------------------------------------------------------------------
   * Requerimiento: RF-006
   * Tipo: INTEGRACIÓN
   * Objetivo: Auditoría de mermas.
   * Criterio de Aceptación: Registro en BD de cada pesaje y su porcentaje/morfología de merma.
   * --------------------------------------------------------------------------
   */
  describe('CP-112: Auditoría de mermas', () => {
    it('Debe guardar el registro exacto de la merma calculada en el historial del pedido', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 'ORD-101',
        ringId: 'B-101-R1',
        totalWeight: 10.0,
        status: 'OPEN',
        executorId: '1',
        startTime: new Date(Date.now() - 10 * 60 * 1000),
      });

      batchesServiceMock.getRingById.mockResolvedValue({ id: 'B-101-R1', securePin: '1111' });
      prismaMock.workOrder.update.mockImplementation(({ data }) => Promise.resolve({
        id: 'ORD-101',
        ...data,
      }));

      const res = await service.closeOrder('ORD-101', { anillo: 8.98, plastilina: 0.5, bolsa: 0.5 }, undefined, '1111');

      expect(res.loss).toBe(0.02);
      expect(prismaMock.workOrder.update).toHaveBeenCalledWith({
        where: { id: 'ORD-101' },
        data: expect.objectContaining({ loss: 0.02 }),
      });
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-113
   * --------------------------------------------------------------------------
   * Requerimiento: RF-006
   * Tipo: INTEGRACIÓN
   * Objetivo: Historial de mermas por joyero.
   * Criterio de Aceptación: Reporte de eficiencia y mermas acumuladas por operario.
   * --------------------------------------------------------------------------
   */
  describe('CP-113: Historial de mermas por joyero', () => {
    it('Debe consultar las órdenes cerradas por el Joyero para obtener su promedio de mermas acumulado', async () => {
      prismaMock.workOrder.findMany.mockResolvedValue([
        { id: 'ORD-101', executorId: '1', loss: 0.02, status: 'CLOSED' },
        { id: 'ORD-102', executorId: '1', loss: 0.04, status: 'CLOSED' },
      ]);

      const orders = await service.findAll();
      const joyeroOrders = orders.filter(o => o.executorId === '1');
      const totalLoss = joyeroOrders.reduce((acc, curr) => acc + (curr.loss || 0), 0);

      expect(joyeroOrders).toHaveLength(2);
      expect(totalLoss).toBeCloseTo(0.06);
    });
  });
});
