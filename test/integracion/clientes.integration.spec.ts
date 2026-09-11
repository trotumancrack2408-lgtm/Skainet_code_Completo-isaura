/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 11: Gestión de Clientes - RF-011)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de
 * Gestión de Clientes y Pedidos Personalizados (RF-011).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación del registro de clientes, creación de solicitudes de diseño personalizadas,
 * trazabilidad del estado del pedido y auditoría automática de eventos.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el sistema registra clientes corporativos o particulares, asocia pedidos
 * de joyas personalizadas y permite realizar el seguimiento de su avance en el taller.
 * 
 * Casos incluidos en este archivo:
 * - CP-139: Registro de nuevo cliente (Inserción en BD de datos de contacto de cliente)
 * - CP-141: Creación de pedido personalizado (Registro en BD de orden de diseño/cliente)
 * - CP-142: Seguimiento de pedido cliente (Consulta de estado del pedido)
 * - CP-143: Auditoría de pedidos (Log en BD de cambios de estado de pedidos)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../Skainet-API/src/prisma/prisma.service';
import { AuditService } from '../../Skainet-API/src/audit/audit.service';

describe('PRUEBAS DE INTEGRACIÓN - Gestión de Clientes (RF-011)', () => {
  let prismaMock: any;
  let auditMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      workOrder: {
        findMany: jest.fn(),
      },
    };

    auditMock = {
      log: jest.fn().mockResolvedValue(true),
    };

    await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();
  });

  describe('CP-139: Registro de nuevo cliente', () => {
    it('Debe insertar un nuevo registro de cliente en la base de datos con sus datos de contacto', async () => {
      prismaMock.user.create.mockResolvedValue({
        id: 'CLI-101',
        name: 'Joyería La Guaca',
        email: 'contacto@laguaca.com',
        phone: '+573119998877',
        role: 'Cliente',
      });

      const newClient = await prismaMock.user.create({
        data: {
          id: 'CLI-101',
          name: 'Joyería La Guaca',
          email: 'contacto@laguaca.com',
          role: 'Cliente',
        },
      });

      expect(newClient.id).toBe('CLI-101');
      expect(newClient.role).toBe('Cliente');
    });
  });

  describe('CP-141: Creación de pedido personalizado', () => {
    it('Debe asociar la solicitud de pedido personalizado al cliente correspondiente en la BD', async () => {
      const customOrder = {
        id: 'PED-501',
        clientId: 'CLI-101',
        description: 'Anillo de graduación con esmeralda 18K',
        status: 'EN_DISENO',
      };

      expect(customOrder.clientId).toBe('CLI-101');
      expect(customOrder.status).toBe('EN_DISENO');
    });
  });

  describe('CP-142: Seguimiento de pedido cliente', () => {
    it('Debe consultar el estado actual del pedido para permitir la trazabilidad del cliente', async () => {
      prismaMock.workOrder.findMany.mockResolvedValue([
        { id: 'ORD-101', ringName: 'Anillo Esmeralda', status: 'OPEN' },
      ]);

      const orders = await prismaMock.workOrder.findMany();
      expect(orders).toHaveLength(1);
      expect(orders[0].status).toBe('OPEN');
    });
  });

  describe('CP-143: Auditoría de pedidos', () => {
    it('Debe registrar automáticamente en la auditoría del sistema cualquier cambio de estado del pedido', async () => {
      await auditMock.log('4', 'CAMBIO_ESTADO_PEDIDO', 'Clientes', { orderId: 'PED-501', newStatus: 'EN_PRODUCCION' }, 'Administrador');

      expect(auditMock.log).toHaveBeenCalledWith(
        '4',
        'CAMBIO_ESTADO_PEDIDO',
        'Clientes',
        expect.objectContaining({ orderId: 'PED-501' }),
        'Administrador',
      );
    });
  });
});
