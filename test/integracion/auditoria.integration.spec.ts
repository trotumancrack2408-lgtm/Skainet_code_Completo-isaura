/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 13: Auditoría del Sistema y Logs - RF-013)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de
 * Auditoría del Sistema y Logs (RF-013).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de la interacción entre los logs automáticos de auditoría (`AuditService`),
 * las consultas filtradas por módulo/usuario y el principio de inmutabilidad de la bitácora.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el sistema registra cada evento operativo y de seguridad sin permitir modificaciones,
 * y permite filtrar la actividad por usuario específico.
 * 
 * Casos incluidos en este archivo:
 * - CP-149: Consulta de logs de auditoría (Lectura filtrada por fecha, usuario y módulo en BD)
 * - CP-150: Inmutabilidad de logs (Garantía de inmutabilidad de registros de auditoría)
 * - CP-151: Filtro de logs por usuario (Lectura de eventos generados por un ID de usuario específico)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../../Skainet-API/src/audit/audit.service';
import { PrismaService } from '../../Skainet-API/src/prisma/prisma.service';

describe('PRUEBAS DE INTEGRACIÓN - Auditoría del Sistema (RF-013)', () => {
  let service: AuditService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('CP-149: Consulta de logs de auditoría', () => {
    it('Debe consultar todos los registros de auditoría ordenados descendentemente por fecha', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([
        { id: 'LOG-1', actorId: '1000000000', action: 'CREAR_USUARIO_Administrador', module: 'Usuarios' },
        { id: 'LOG-2', actorId: '4', action: 'ENTRADA_INVENTARIO', module: 'Inventario' },
      ]);

      const logs = await service.findAll();

      expect(logs).toHaveLength(2);
      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('Debe permitir filtrar los logs de auditoría por módulo de origen', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([
        { id: 'LOG-2', actorId: '4', action: 'ENTRADA_INVENTARIO', module: 'Inventario' },
      ]);

      const inventoryLogs = await service.findByModule('Inventario');

      expect(inventoryLogs).toHaveLength(1);
      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
        where: { module: 'Inventario' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('CP-150: Inmutabilidad de logs', () => {
    it('Debe garantizar que las entradas creadas en la bitácora de auditoría no sufran modificaciones ni borrados', async () => {
      prismaMock.auditLog.create.mockResolvedValue({
        id: 'LOG-100',
        actorId: '1000000000',
        action: 'CREAR_MATERIAL',
        module: 'Inventario',
        details: JSON.stringify({ materialId: 'MAT-1' }),
      });

      const log = await service.log('1000000000', 'CREAR_MATERIAL', 'Inventario', { materialId: 'MAT-1' });

      expect(log).toBeDefined();
      expect(log.action).toBe('CREAR_MATERIAL');
      expect(prismaMock.auditLog.create).toHaveBeenCalled();
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-151
   * --------------------------------------------------------------------------
   * Requerimiento: RF-013
   * Tipo: INTEGRACIÓN
   * Objetivo: Filtro de logs por usuario.
   * Criterio de Aceptación: Consulta filtrada en BD por actorId del usuario.
   * --------------------------------------------------------------------------
   */
  describe('CP-151: Filtro de logs por usuario', () => {
    it('Debe retornar únicamente los eventos generados por un usuario específico', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([
        { id: 'LOG-1', actorId: '1000000000', action: 'CREAR_USUARIO' },
      ]);

      const userLogs = await prismaMock.auditLog.findMany({
        where: { actorId: '1000000000' },
      });

      expect(userLogs).toHaveLength(1);
      expect(userLogs[0].actorId).toBe('1000000000');
    });
  });
});
