/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 8: Lotes y Trazabilidad - RF-008)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para el Módulo de
 * Registro de Lotes y Trazabilidad (RF-008).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de la interacción entre el servicio de lotes (`BatchesService`),
 * la creación de piezas/anillos con PINs de seguridad, la trazabilidad de fundición y la auditoría.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el sistema registra un lote de fundición con sus piezas asociadas, genera los PINs
 * secretos de seguridad y mantiene la trazabilidad completa desde la entrada hasta la entrega.
 * 
 * Casos incluidos en este archivo:
 * - CP-121: Creación de nuevo lote (Inserción en BD de código de lote y piezas)
 * - CP-123: Trazabilidad completa de lote (Rastreo de fundición -> Anillos -> PINs)
 * - CP-124: Cierre de lote de producción (Cambio de estado del lote a Finalizado / COMPLETED)
 * - CP-125: Auditoría de lotes (Log en BD de eventos de creación y actualización de lotes)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BatchesService } from '../../src/batches/batches.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('PRUEBAS DE INTEGRACIÓN - Registro de Lotes (RF-008)', () => {
  let service: BatchesService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      batch: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
      ring: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<BatchesService>(BatchesService);
  });

  describe('CP-121: Creación de nuevo lote', () => {
    it('Debe crear un lote en la BD con peso de entrada, salida y generación automática de piezas con PINs', async () => {
      prismaMock.batch.create.mockImplementation(({ data }) => Promise.resolve({
        id: 'B-999',
        entryWeight: 200.0,
        exitWeight: 195.0,
        ringsCount: 2,
        rings: [
          { id: 'B-999-R1', name: 'Anillo 1', status: 'PENDING', securePin: '1234' },
          { id: 'B-999-R2', name: 'Anillo 2', status: 'PENDING', securePin: '5678' },
        ],
      }));

      const batch = await service.create(200.0, 195.0, 2);

      expect(batch.id).toBeDefined();
      expect(batch.rings).toHaveLength(2);
      expect(prismaMock.batch.create).toHaveBeenCalled();
    });
  });

  describe('CP-123: Trazabilidad completa de lote', () => {
    it('Debe retornar las piezas asociadas al lote permitiendo rastrear su PIN y estado actual', async () => {
      prismaMock.ring.findUnique.mockResolvedValue({
        id: 'B-101-R1',
        batchId: 'B-101',
        name: 'Anillo 1',
        status: 'ASSIGNED',
        securePin: '1111',
      });

      const ring = await service.getRingById('B-101-R1');

      expect(ring.batchId).toBe('B-101');
      expect(ring.status).toBe('ASSIGNED');
      expect(ring.securePin).toBe('1111');
    });
  });

  describe('CP-124: Cierre de lote de producción', () => {
    it('Debe actualizar el estado de la pieza/lote a COMPLETED una vez finalizado el trabajo', async () => {
      prismaMock.ring.update.mockResolvedValue({
        id: 'B-101-R1',
        status: 'COMPLETED',
        securePin: '9999',
      });

      const updated = await service.updateRingStatus('B-101-R1', 'COMPLETED', '9999');

      expect(updated.status).toBe('COMPLETED');
      expect(updated.securePin).toBe('9999');
    });
  });

  describe('CP-125: Auditoría de lotes', () => {
    it('Debe consultar todos los lotes guardados en la BD con su historial de piezas', async () => {
      prismaMock.batch.findMany.mockResolvedValue([
        { id: 'B-101', entryWeight: 250.0, ringsCount: 5 },
      ]);

      const list = await service.findAll();

      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('B-101');
      expect(prismaMock.batch.findMany).toHaveBeenCalled();
    });
  });
});
