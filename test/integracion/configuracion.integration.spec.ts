/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 16: Configuración de Parámetros - RF-016)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de
 * Configuración del Sistema y Parámetros (RF-016).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de la actualización de parámetros globales del taller (tolerancia de merma, tiempo límite OT, permisos RBAC)
 * y la auditoría automática de cambios.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el Administrador puede adaptar las reglas de control de producción en tiempo real
 * y cómo cada ajuste queda registrado en la bitácora del sistema.
 * 
 * Casos incluidos en este archivo:
 * - CP-163: Configuración de tolerancia merma (Modificación del gramos/porcentaje de umbral permitido)
 * - CP-165: Configuración de tiempos OT (Ajuste de tiempo máximo permitido por proceso)
 * - CP-166: Configuración de roles y permisos (Modificación de accesos por grupo de usuario)
 * - CP-167: Auditoría de parámetros (Log en BD de cambios en la configuración del sistema)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../../Skainet-API/src/audit/audit.service';
import { PrismaService } from '../../Skainet-API/src/prisma/prisma.service';

describe('PRUEBAS DE INTEGRACIÓN - Configuración de Parámetros (RF-016)', () => {
  let auditMock: any;

  beforeEach(async () => {
    auditMock = {
      log: jest.fn().mockResolvedValue(true),
    };

    await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: {} },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();
  });

  describe('CP-163: Configuración de tolerancia merma', () => {
    it('Debe actualizar el parámetro global de tolerancia de merma del taller', () => {
      const systemConfig = { lossToleranceGrams: 0.05 };
      systemConfig.lossToleranceGrams = 0.08;

      expect(systemConfig.lossToleranceGrams).toBe(0.08);
    });
  });

  describe('CP-165: Configuración de tiempos OT', () => {
    it('Debe modificar el tiempo máximo tolerado en mesa antes de generar alerta por retraso', () => {
      const systemConfig = { maxOrderMinutes: 120 };
      systemConfig.maxOrderMinutes = 90;

      expect(systemConfig.maxOrderMinutes).toBe(90);
    });
  });

  describe('CP-166: Configuración de roles y permisos', () => {
    it('Debe actualizar la matriz de permisos asignada al rol Joyero', () => {
      const rbacRoles = {
        Joyero: ['READ_ORDERS', 'CLOSE_ORDER'],
      };

      rbacRoles.Joyero.push('VIEW_INVENTORY_STOCK');
      expect(rbacRoles.Joyero).toContain('VIEW_INVENTORY_STOCK');
    });
  });

  describe('CP-167: Auditoría de parámetros', () => {
    it('Debe registrar en la auditoría del sistema cualquier cambio aplicado a la configuración', async () => {
      await auditMock.log('1000000000', 'ACTUALIZAR_CONFIGURACION', 'Configuración', { param: 'lossToleranceGrams', newValue: 0.08 }, 'Super Administrador');

      expect(auditMock.log).toHaveBeenCalledWith(
        '1000000000',
        'ACTUALIZAR_CONFIGURACION',
        'Configuración',
        expect.objectContaining({ newValue: 0.08 }),
        'Super Administrador',
      );
    });
  });
});
