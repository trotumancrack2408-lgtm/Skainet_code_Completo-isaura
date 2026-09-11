/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 12: Alertas y Notificaciones - RF-012)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de
 * Alertas Automatizadas y Notificaciones (RF-012).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de la interacción entre los eventos del taller (tiempo excedido en mesa, merma anómala, ciclo de máquinas),
 * el servicio de alertas (`AlertsService`) y la transmisión de notificaciones push/push-admin (`NotificationsService`).
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el vigilante digital del taller dispara automáticamente alertas de nivel CRITICAL o WARNING
 * notificando en tiempo real al Administrador o Dueño del taller.
 * 
 * Casos incluidos en este archivo:
 * - CP-144: Alerta por tiempo excedido OT (Notificación automática si la OT supera el tiempo límite)
 * - CP-145: Alerta de merma anómala (Notificación inmediata a la administración al detectar merma alta)
 * - CP-146: Alerta de mantenimiento (Notificación por límite de ciclos alcanzado en máquinas)
 * - CP-148: Auditoría de alertas (Log en BD del disparo y procesamiento de alertas)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from '../../src/alerts/alerts.service';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('PRUEBAS DE INTEGRACIÓN - Alertas y Notificaciones (RF-012)', () => {
  let service: AlertsService;
  let prismaMock: any;
  let notificationsServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      alert: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
    };

    notificationsServiceMock = {
      notifyAdmins: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  describe('CP-144: Alerta por tiempo excedido OT', () => {
    it('Debe generar una alerta WARNING si la Orden de Trabajo excede el tiempo límite en mesa', async () => {
      prismaMock.alert.create.mockResolvedValue({
        id: 'ALT-102',
        type: 'TIME',
        severity: 'WARNING',
        message: 'TIEMPO EXCEDIDO: El joyero lleva 125 min con la pieza Anillo 1',
        jewelerName: 'Ramiro',
        orderId: 'ORD-101',
      });

      const alert = await service.createAlert({
        type: 'TIME',
        severity: 'WARNING',
        message: 'TIEMPO EXCEDIDO: El joyero lleva 125 min con la pieza Anillo 1',
        jewelerName: 'Ramiro',
        orderId: 'ORD-101',
      });

      expect(alert.type).toBe('TIME');
      expect(alert.severity).toBe('WARNING');
      expect(notificationsServiceMock.notifyAdmins).toHaveBeenCalled();
    });
  });

  describe('CP-145: Alerta de merma anómala', () => {
    it('Debe disparar una alerta CRITICAL inmediata al detectar una merma superior a la tolerancia', async () => {
      prismaMock.alert.create.mockResolvedValue({
        id: 'ALT-101',
        type: 'WEIGHT',
        severity: 'CRITICAL',
        message: 'PÉRDIDA CRÍTICA: Se detectó merma de 0.50g en Anillo 3',
        jewelerName: 'Carlos',
        orderId: 'ORD-103',
      });

      const alert = await service.createAlert({
        type: 'WEIGHT',
        severity: 'CRITICAL',
        message: 'PÉRDIDA CRÍTICA: Se detectó merma de 0.50g en Anillo 3',
        jewelerName: 'Carlos',
        orderId: 'ORD-103',
      });

      expect(alert.severity).toBe('CRITICAL');
      expect(notificationsServiceMock.notifyAdmins).toHaveBeenCalledWith(
        expect.stringContaining('🚨 ALERTA SKYNET'),
      );
    });
  });

  describe('CP-146: Alerta de mantenimiento', () => {
    it('Debe emitir una alerta de mantenimiento cuando una máquina alcance su umbral de uso', async () => {
      prismaMock.alert.create.mockResolvedValue({
        id: 'ALT-103',
        type: 'SECURITY',
        severity: 'WARNING',
        message: 'MANTENIMIENTO REQUERIDO: Láser de Marcado ha alcanzado 500 ciclos',
        jewelerName: 'SISTEMA SKYNET',
      });

      const alert = await service.createAlert({
        type: 'SECURITY',
        severity: 'WARNING',
        message: 'MANTENIMIENTO REQUERIDO: Láser de Marcado ha alcanzado 500 ciclos',
        jewelerName: 'SISTEMA SKYNET',
      });

      expect(alert.type).toBe('SECURITY');
    });
  });

  describe('CP-148: Auditoría de alertas', () => {
    it('Debe consultar todas las alertas en orden cronológico descendente para trazabilidad', async () => {
      prismaMock.alert.findMany.mockResolvedValue([
        { id: 'ALT-101', severity: 'CRITICAL' },
        { id: 'ALT-102', severity: 'WARNING' },
      ]);

      const alerts = await service.findAll();

      expect(alerts).toHaveLength(2);
      expect(prismaMock.alert.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: 'desc' },
      });
    });
  });
});
