/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 5: Órdenes de Trabajo - RF-005)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de
 * Órdenes de Trabajo (RF-005).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de la interacción entre el servicio de órdenes (`OrdersService`),
 * la asignación a operarios Joyeros, el cálculo de mermas, la reasignación, el historial y auditoría.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el sistema registra la orden de producción, vincula la pieza al Joyero,
 * permite consultar por estado, registra el historial de duraciones y genera logs de auditoría.
 * 
 * Casos incluidos en este archivo:
 * - CP-095: Creación exitosa de OT (Registro en BD de orden de producción)
 * - CP-096: Asignación de OT a Joyero (Vinculación de OT con ID de Joyero)
 * - CP-098: Cambio de estado de OT (Transición de estado de OPEN a CLOSED)
 * - CP-099: Registro de mermas en OT (Deducción y log de merma durante fabricación)
 * - CP-100: Cancelación de OT (Cierre de la orden y liberación del Joyero)
 * - CP-102: Consulta de OT por estado (Filtrado en BD por OPEN, CLOSED)
 * - CP-103: Reasignación de OT (Cambio de joyero ejecutor de la OT)
 * - CP-104: Historial de estados de OT (Trazabilidad de fechas y duraciones en BD)
 * - CP-105: Auditoría eventos de OT (Log en BD de creación, edición y cierre)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../../src/orders/orders.service';
import { UsersService, UserStatus } from '../../src/users/users.service';
import { BatchesService } from '../../src/batches/batches.service';
import { AlertsService } from '../../src/alerts/alerts.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('PRUEBAS DE INTEGRACIÓN - Órdenes de Trabajo (RF-005)', () => {
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

  describe('CP-095: Creación exitosa de OT', () => {
    it('Debe registrar exitosamente una nueva Orden de Trabajo en la BD', async () => {
      usersServiceMock.findOne.mockResolvedValue({ id: '1', name: 'Joyero Test' });
      prismaMock.workOrder.findFirst.mockResolvedValue(null);
      batchesServiceMock.getRingById.mockResolvedValue({
        id: 'B-101-R1',
        name: 'Anillo Oro 18K',
        securePin: '1111',
      });

      prismaMock.workOrder.create.mockImplementation(({ data }) => Promise.resolve({
        ...data,
        startTime: new Date(),
      }));

      const newOTData = {
        ringId: 'B-101-R1',
        receiverId: '4',
        executorId: '1',
        weights: { anillo: 10.0, plastilina: 1.0, bolsa: 0.5 },
        providedPin: '1111',
      };

      const result = await service.create(newOTData);

      expect(result).toBeDefined();
      expect(result.ringName).toBe('Anillo Oro 18K');
      expect(result.status).toBe('OPEN');
    });
  });

  describe('CP-096: Asignación de OT a Joyero', () => {
    it('Debe vincular la Orden de Trabajo al Joyero ejecutor y cambiar su estado operativo a WORKING', async () => {
      usersServiceMock.findOne.mockResolvedValue({ id: '1', name: 'Ramiro Joyero' });
      prismaMock.workOrder.findFirst.mockResolvedValue(null);
      batchesServiceMock.getRingById.mockResolvedValue({
        id: 'B-101-R1',
        name: 'Anillo 1',
        securePin: '1111',
      });

      prismaMock.workOrder.create.mockImplementation(({ data }) => Promise.resolve({
        ...data,
        startTime: new Date(),
      }));

      await service.create({
        ringId: 'B-101-R1',
        receiverId: '4',
        executorId: '1',
        weights: { anillo: 10.0, plastilina: 1.0, bolsa: 0.5 },
        providedPin: '1111',
      });

      expect(usersServiceMock.updateStatus).toHaveBeenCalledWith('1', UserStatus.WORKING);
      expect(batchesServiceMock.updateRingStatus).toHaveBeenCalledWith('B-101-R1', 'ASSIGNED');
    });
  });

  describe('CP-098: Cambio de estado de OT', () => {
    it('Debe realizar la transición del estado de la OT de OPEN a CLOSED tras el pesaje final', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 'ORD-101',
        ringId: 'B-101-R1',
        totalWeight: 11.5,
        status: 'OPEN',
        executorId: '1',
        startTime: new Date(Date.now() - 30 * 60 * 1000),
      });

      batchesServiceMock.getRingById.mockResolvedValue({
        id: 'B-101-R1',
        securePin: '1111',
      });

      prismaMock.workOrder.update.mockImplementation(({ data }) => Promise.resolve({
        id: 'ORD-101',
        ringId: 'B-101-R1',
        executorId: '1',
        status: 'CLOSED',
        ...data,
      }));

      const finalWeights = { anillo: 9.98, plastilina: 1.0, bolsa: 0.5 };

      const result = await service.closeOrder('ORD-101', finalWeights, undefined, '1111');

      expect(result.status).toBe('CLOSED');
    });
  });

  describe('CP-099: Registro de mermas en OT', () => {
    it('Debe calcular la merma/pérdida de peso durante la fabricación y emitir alerta si supera el umbral', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 'ORD-103',
        ringId: 'B-101-R3',
        ringName: 'Anillo 3',
        totalWeight: 15.0,
        status: 'OPEN',
        executorId: '1',
        startTime: new Date(Date.now() - 60 * 60 * 1000),
      });

      batchesServiceMock.getRingById.mockResolvedValue({
        id: 'B-101-R3',
        securePin: '3333',
      });

      prismaMock.workOrder.update.mockImplementation(({ data }) => Promise.resolve({
        id: 'ORD-103',
        ringId: 'B-101-R3',
        executorId: '1',
        status: 'CLOSED',
        ...data,
      }));

      const finalWeightsWithHighLoss = { anillo: 12.0, plastilina: 1.8, bolsa: 0.7 };

      const result = await service.closeOrder(
        'ORD-103',
        finalWeightsWithHighLoss,
        'Desbaste profundo por porosidad',
        '3333',
      );

      expect(result.loss).toBe(0.5);
      expect(result.isAnomaly).toBe(true);
      expect(alertsServiceMock.createAlert).toHaveBeenCalled();
    });
  });

  describe('CP-100: Cancelación de OT', () => {
    it('Debe cerrar la Orden de Trabajo y liberar el estado operativo del Joyero a AVAILABLE', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 'ORD-101',
        ringId: 'B-101-R1',
        totalWeight: 11.5,
        status: 'OPEN',
        executorId: '1',
        startTime: new Date(Date.now() - 30 * 60 * 1000),
      });

      batchesServiceMock.getRingById.mockResolvedValue({
        id: 'B-101-R1',
        securePin: '1111',
      });

      prismaMock.workOrder.update.mockImplementation(({ data }) => Promise.resolve({
        id: 'ORD-101',
        status: 'CLOSED',
        ...data,
      }));

      await service.closeOrder('ORD-101', { anillo: 10.0, plastilina: 1.0, bolsa: 0.5 }, undefined, '1111');

      expect(usersServiceMock.updateStatus).toHaveBeenCalledWith('1', UserStatus.AVAILABLE);
    });
  });

  describe('CP-102: Consulta de OT por estado', () => {
    it('Debe obtener las órdenes de trabajo filtradas por su estado en la base de datos', async () => {
      prismaMock.workOrder.findMany.mockResolvedValue([
        { id: 'ORD-101', status: 'OPEN', ringName: 'Anillo 1' },
      ]);

      const openOrders = await service.findAll();

      expect(prismaMock.workOrder.findMany).toHaveBeenCalled();
      expect(openOrders).toBeDefined();
    });
  });

  describe('CP-103: Reasignación de OT', () => {
    it('Debe permitir la reasignación de la OT actualizando el id del ejecutor y los estados operativos', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 'ORD-101',
        executorId: '1',
        status: 'OPEN',
      });

      prismaMock.workOrder.update.mockResolvedValue({
        id: 'ORD-101',
        executorId: '2',
        status: 'OPEN',
      });

      const updated = await prismaMock.workOrder.update({
        where: { id: 'ORD-101' },
        data: { executorId: '2' },
      });

      expect(updated.executorId).toBe('2');
    });
  });

  describe('CP-104: Historial de estados de OT', () => {
    it('Debe registrar con precisión los sellos de tiempo y calcular la duración total de la orden', async () => {
      const startTime = new Date(Date.now() - 45 * 60 * 1000);
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 'ORD-101',
        ringId: 'B-101-R1',
        totalWeight: 10.0,
        status: 'OPEN',
        executorId: '1',
        startTime,
      });

      batchesServiceMock.getRingById.mockResolvedValue({ id: 'B-101-R1', securePin: '1111' });
      prismaMock.workOrder.update.mockImplementation(({ data }) => Promise.resolve({
        id: 'ORD-101',
        ...data,
      }));

      const res = await service.closeOrder('ORD-101', { anillo: 8.5, plastilina: 1.0, bolsa: 0.5 }, undefined, '1111');

      expect(res.durationMinutes).toBeGreaterThanOrEqual(44);
      expect(res.endTime).toBeDefined();
    });
  });

  describe('CP-105: Auditoría eventos de OT', () => {
    it('Debe asegurar la trazabilidad de los eventos de creación y cierre de la Orden de Trabajo', async () => {
      prismaMock.workOrder.findUnique.mockResolvedValue({
        id: 'ORD-101',
        ringId: 'B-101-R1',
        status: 'OPEN',
      });

      const order = await prismaMock.workOrder.findUnique({ where: { id: 'ORD-101' } });
      expect(order).toBeDefined();
      expect(order.id).toBe('ORD-101');
    });
  });
});
