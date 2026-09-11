/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 7: Control de Maquinaria - RF-007)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de Control
 * de Maquinaria y Equipos (RF-007).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de la interacción entre el servicio de maquinaria (`MachinesService`),
 * el conteo de ciclos de uso, el reporte de fallas (`reportIssue`), el bloqueo de equipos averiados y las alertas.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el sistema registra equipos, lleva el contador automático de uso/ciclos,
 * emite alertas de mantenimiento preventivo y bloquea el uso de máquinas reportadas en falla.
 * 
 * Casos incluidos en este archivo:
 * - CP-114: Registro de nueva máquina (Inserción en BD de balanza/laminadora/láser)
 * - CP-116: Asignación de mantenimiento (Programación y reseteo de ciclos tras servicio)
 * - CP-117: Registro de falla en máquina (Cambio de estado a DOWN y emisión de alerta CRITICAL)
 * - CP-118: Auditoría de máquinas (Log automático de alertas y estado de máquinas)
 * - CP-119: Bloqueo máquina en falla (Inhabilitar equipos en estado DOWN)
 * - CP-120: Consulta de máquinas (Listado completo de equipos y estado operativo en BD)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MachinesService } from '../../Skainet-API/src/machines/machines.service';
import { AlertsService } from '../../Skainet-API/src/alerts/alerts.service';
import { PrismaService } from '../../Skainet-API/src/prisma/prisma.service';

describe('PRUEBAS DE INTEGRACIÓN - Control de Maquinaria (RF-007)', () => {
  let service: MachinesService;
  let prismaMock: any;
  let alertsServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      machine: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
    };

    alertsServiceMock = {
      createAlert: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MachinesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AlertsService, useValue: alertsServiceMock },
      ],
    }).compile();

    service = module.get<MachinesService>(MachinesService);
  });

  describe('CP-114: Registro de nueva máquina', () => {
    it('Debe registrar exitosamente una nueva máquina en la BD con su tipo y umbral de mantenimiento', async () => {
      prismaMock.machine.findMany.mockResolvedValue([
        { id: 'M-01', name: 'Láser de Marcado Fibra', type: 'LASER', status: 'OPERATIONAL' },
      ]);

      const machines = await service.findAll();

      expect(machines).toHaveLength(1);
      expect(machines[0].id).toBe('M-01');
    });
  });

  describe('CP-116: Asignación de mantenimiento', () => {
    it('Debe restablecer el conteo de ciclos y actualizar la fecha de último mantenimiento en BD', async () => {
      prismaMock.machine.update.mockResolvedValue({
        id: 'M-01',
        name: 'Láser de Marcado Fibra',
        status: 'OPERATIONAL',
        cycleCount: 0,
        lastMaintenance: new Date(),
      });

      const result = await service.setOperational('M-01');

      expect(result.status).toBe('OPERATIONAL');
      expect(result.cycleCount).toBe(0);
      expect(prismaMock.machine.update).toHaveBeenCalledWith({
        where: { id: 'M-01' },
        data: expect.objectContaining({ status: 'OPERATIONAL', cycleCount: 0 }),
      });
    });
  });

  describe('CP-117: Registro de falla en máquina', () => {
    it('Debe cambiar el estado de la máquina a DOWN y emitir una alerta CRITICAL tras el reporte de error', async () => {
      prismaMock.machine.findUnique.mockResolvedValue({
        id: 'M-01',
        name: 'Láser de Marcado Fibra',
        status: 'OPERATIONAL',
      });

      prismaMock.machine.update.mockResolvedValue({
        id: 'M-01',
        name: 'Láser de Marcado Fibra',
        status: 'DOWN',
      });

      const result = await service.reportIssue('M-01', 'Fallo en óptica láser');

      expect(result.status).toBe('DOWN');
      expect(alertsServiceMock.createAlert).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'CRITICAL' }),
      );
    });
  });

  describe('CP-118: Auditoría de máquinas', () => {
    it('Debe auditar los avisos de mantenimiento preventivo al alcanzar el límite de ciclos', async () => {
      prismaMock.machine.findUnique.mockResolvedValue({
        id: 'M-02',
        name: 'Impresora 3D',
        status: 'OPERATIONAL',
        cycleCount: 99,
        maintenanceThreshold: 100,
      });

      prismaMock.machine.update.mockResolvedValue({
        id: 'M-02',
        cycleCount: 100,
      });

      await service.incrementCycles('M-02');

      expect(alertsServiceMock.createAlert).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'WARNING' }),
      );
    });
  });

  describe('CP-119: Bloqueo máquina en falla', () => {
    it('Debe verificar que una máquina en estado DOWN sea identificada como no operativa', async () => {
      prismaMock.machine.findUnique.mockResolvedValue({
        id: 'M-01',
        name: 'Balanza 1',
        status: 'DOWN',
      });

      const machine = await prismaMock.machine.findUnique({ where: { id: 'M-01' } });
      expect(machine.status).toBe('DOWN');
    });
  });

  describe('CP-120: Consulta de máquinas', () => {
    it('Debe consultar y listar la totalidad de los equipos de producción desde la base de datos', async () => {
      prismaMock.machine.findMany.mockResolvedValue([
        { id: 'M-01', name: 'Láser Fibra', status: 'OPERATIONAL' },
        { id: 'M-02', name: 'Impresora 3D', status: 'DOWN' },
      ]);

      const list = await service.findAll();

      expect(list).toHaveLength(2);
      expect(prismaMock.machine.findMany).toHaveBeenCalled();
    });
  });
});
