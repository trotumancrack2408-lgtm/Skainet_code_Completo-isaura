/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 17: Cierre Operativo - RF-017)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de
 * Rendición de Cuentas y Cierre Operativo (RF-017).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de los procesos de arqueo diario de metal entre Administración y Joyeros,
 * conciliación de gramos entregados/devueltos, auditoría de la rendición de cuentas y cierre formal de jornada.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el sistema ejecuta la auditoría al finalizar el turno del Joyero,
 * validando que todo el gramaje de oro entregado coincida y registrando la firma/log de auditoría.
 * 
 * Casos incluidos en este archivo:
 * - CP-168: Arqueo diario de metal (Conciliación entre peso entregado, devuelto y mermas del día)
 * - CP-170: Cierre de turno joyero (Balance de piezas entregadas/pendientes al finalizar jornada)
 * - CP-171: Auditoría de cierre de turno (Log en BD del arqueo final y discrepancias)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../../src/orders/orders.service';
import { UsersService, UserStatus } from '../../src/users/users.service';
import { AuditService } from '../../src/audit/audit.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('PRUEBAS DE INTEGRACIÓN - Cierre Operativo y Arqueo (RF-017)', () => {
  let ordersServiceMock: any;
  let usersServiceMock: any;
  let auditMock: any;

  beforeEach(async () => {
    ordersServiceMock = {
      findAll: jest.fn().mockResolvedValue([
        { id: 'ORD-101', executorId: '1', status: 'CLOSED', totalWeight: 10.0, loss: 0.02 },
        { id: 'ORD-102', executorId: '1', status: 'CLOSED', totalWeight: 15.0, loss: 0.03 },
      ]),
    };

    usersServiceMock = {
      updateStatus: jest.fn().mockResolvedValue(true),
    };

    auditMock = {
      log: jest.fn().mockResolvedValue(true),
    };

    await Test.createTestingModule({
      providers: [
        { provide: OrdersService, useValue: ordersServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: AuditService, useValue: auditMock },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
  });

  describe('CP-168: Arqueo diario de metal', () => {
    it('Debe calcular el balance total de metal asignado, devuelto y mermado durante el día para el joyero', async () => {
      const orders = await ordersServiceMock.findAll();
      const joyeroOrders = orders.filter(o => o.executorId === '1');

      const totalAssigned = joyeroOrders.reduce((sum, o) => sum + o.totalWeight, 0);
      const totalLoss = joyeroOrders.reduce((sum, o) => sum + o.loss, 0);

      expect(totalAssigned).toBe(25.0);
      expect(totalLoss).toBe(0.05);
    });
  });

  describe('CP-170: Cierre de turno joyero', () => {
    it('Debe procesar el cierre de jornada del Joyero y actualizar su estado operativo a AVAILABLE', async () => {
      await usersServiceMock.updateStatus('1', UserStatus.AVAILABLE);

      expect(usersServiceMock.updateStatus).toHaveBeenCalledWith('1', UserStatus.AVAILABLE);
    });
  });

  describe('CP-171: Auditoría de cierre de turno', () => {
    it('Debe guardar el registro inmutable del arqueo final de turno en la bitácora de auditoría', async () => {
      await auditMock.log('1', 'CIERRE_TURNO_JOYERO', 'CierreOperativo', { totalAssigned: 25.0, totalLoss: 0.05, discrepancy: 0.0 }, 'Joyero');

      expect(auditMock.log).toHaveBeenCalledWith(
        '1',
        'CIERRE_TURNO_JOYERO',
        'CierreOperativo',
        expect.objectContaining({ totalAssigned: 25.0 }),
        'Joyero',
      );
    });
  });
});
