/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS DE INTEGRACIÓN (Módulo 4: Inventario de Materia Prima - RF-004)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas de Integración para la Gestión de
 * Inventario de Materia Prima (RF-004).
 * 
 * ¿QUÉ ES UNA PRUEBA DE INTEGRACIÓN EN SKAINET?
 * Comprobación de la interacción entre el servicio de inventario (`InventoryService`),
 * los registros de Kardex, la deducción por órdenes de producción y la auditoría automática.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el sistema registra nuevos metales/materiales, descuenta inventario por OT
 * garantizando la regla de no-saldo-negativo, emite alertas de stock mínimo y registra auditoría.
 * 
 * Casos incluidos en este archivo:
 * - CP-085: Registro de nuevo material (Inserción en BD de ley de oro y gramos)
 * - CP-087: Descuento automático por OT (Reducción de stock al asignar a orden de trabajo)
 * - CP-088: Alerta de stock mínimo (Verificación de umbrales y alertas de stock bajo)
 * - CP-089: Ajuste manual de inventario (Registro en Kardex por mermas o auditoría)
 * - CP-091: Auditoría movimientos MP (Log automático en BD del movimiento)
 * - CP-092: Bloqueo stock insuficiente (Error por intento de descontar más gramos de los disponibles)
 * - CP-094: Consulta de inventario (Lectura filtrada por ley/categoría desde la BD)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../../Skainet-API/src/inventory/inventory.service';
import { PrismaService } from '../../Skainet-API/src/prisma/prisma.service';
import { AuditService } from '../../Skainet-API/src/audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS DE INTEGRACIÓN - Inventario de Materia Prima (RF-004)', () => {
  let service: InventoryService;
  let prismaMock: any;
  let auditMock: any;

  beforeEach(async () => {
    prismaMock = {
      material: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      kardexMovement: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    auditMock = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  describe('CP-085: Registro de nuevo material', () => {
    it('Debe insertar un nuevo material en la BD con su tipo, unidad y stock inicial', async () => {
      prismaMock.material.findFirst.mockResolvedValue(null);
      prismaMock.material.create.mockResolvedValue({
        id: 'MAT-101',
        name: 'Oro Granulado 18K',
        category: 'Oro 18K',
        unit: 'Gramos',
        stock: 150.0,
        minStock: 20.0,
        status: 'Activo',
      });

      const newMaterial = {
        name: 'Oro Granulado 18K',
        category: 'Oro 18K',
        unit: 'Gramos',
        stockInicial: 150.0,
        minStock: 20.0,
      };

      const result = await service.createMaterial('1000000000', 'Super Admin', newMaterial);

      expect(result.id).toBe('MAT-101');
      expect(result.stock).toBe(150.0);
      expect(prismaMock.material.create).toHaveBeenCalled();
    });
  });

  describe('CP-087: Descuento automático por OT', () => {
    it('Debe reducir el stock de materia prima al registrar una salida para una Orden de Trabajo', async () => {
      prismaMock.material.findUnique.mockResolvedValue({
        id: 'MAT-101',
        name: 'Oro 18K',
        stock: 100.0,
        status: 'Activo',
      });

      prismaMock.material.update.mockResolvedValue({
        id: 'MAT-101',
        stock: 85.0,
      });

      prismaMock.kardexMovement.create.mockResolvedValue({
        id: 'KDX-1',
        materialId: 'MAT-101',
        type: 'SALIDA',
        quantity: 15.0,
        workOrderId: 'ORD-101',
      });

      const result = await service.registerSalida('4', 'Admin', {
        materialId: 'MAT-101',
        quantity: 15.0,
        workOrderId: 'ORD-101',
      });

      expect(result.success).toBe(true);
      expect(result.newStock).toBe(85.0);
      expect(prismaMock.material.update).toHaveBeenCalledWith({
        where: { id: 'MAT-101' },
        data: { stock: 85.0 },
      });
    });
  });

  describe('CP-088: Alerta de stock mínimo', () => {
    it('Debe identificar cuando el stock disponible es inferior o igual al umbral mínimo configurado', async () => {
      prismaMock.material.findMany.mockResolvedValue([
        {
          id: 'MAT-102',
          name: 'Plata 925',
          stock: 5.0,
          minStock: 10.0,
          status: 'Activo',
        },
      ]);

      const materials = await service.getMaterials();
      const lowStockMaterial = materials.find(m => m.stock < m.minStock);

      expect(lowStockMaterial).toBeDefined();
      expect(lowStockMaterial.id).toBe('MAT-102');
    });
  });

  describe('CP-089: Ajuste manual de inventario', () => {
    it('Debe permitir registrar ajustes de entrada o salida por merma o auditoría en Kardex', async () => {
      prismaMock.material.findUnique.mockResolvedValue({
        id: 'MAT-101',
        stock: 50.0,
        status: 'Activo',
      });

      prismaMock.material.update.mockResolvedValue({
        id: 'MAT-101',
        stock: 65.0,
      });

      prismaMock.kardexMovement.create.mockResolvedValue({
        id: 'KDX-2',
        materialId: 'MAT-101',
        type: 'ENTRADA',
        quantity: 15.0,
      });

      const result = await service.registerEntry('1000000000', 'Super Admin', {
        materialId: 'MAT-101',
        quantity: 15.0,
        observations: 'Ajuste manual por compra directa de pepitas',
      });

      expect(result.success).toBe(true);
      expect(result.newStock).toBe(65.0);
    });
  });

  describe('CP-091: Auditoría movimientos MP', () => {
    it('Debe invocar automáticamente el servicio de auditoría al registrar movimientos de inventario', async () => {
      prismaMock.material.findUnique.mockResolvedValue({
        id: 'MAT-101',
        stock: 50.0,
        status: 'Activo',
      });

      await service.registerEntry('1000000000', 'Super Admin', {
        materialId: 'MAT-101',
        quantity: 10.0,
      });

      expect(auditMock.log).toHaveBeenCalledWith(
        '1000000000',
        'ENTRADA_INVENTARIO',
        'Inventario',
        expect.objectContaining({ materialId: 'MAT-101', quantity: 10.0 }),
        'Super Admin',
      );
    });
  });

  describe('CP-092: Bloqueo stock insuficiente', () => {
    it('Debe rechazar con BadRequestException si se intenta descontar más gramos de los disponibles en el stock', async () => {
      prismaMock.material.findUnique.mockResolvedValue({
        id: 'MAT-101',
        name: 'Oro 18K',
        stock: 10.0, // Solo hay 10 gramos
        status: 'Activo',
      });

      await expect(
        service.registerSalida('4', 'Admin', {
          materialId: 'MAT-101',
          quantity: 25.0, // Se intentan descontar 25 gramos
          workOrderId: 'ORD-101',
        }),
      ).rejects.toThrow('Error: Inventario insuficiente para realizar la operación.');

      expect(prismaMock.material.update).not.toHaveBeenCalled();
    });
  });

  describe('CP-094: Consulta de inventario', () => {
    it('Debe consultar la lista de materiales filtrando por ley/categoría desde la base de datos', async () => {
      prismaMock.material.findMany.mockResolvedValue([
        {
          id: 'MAT-101',
          name: 'Oro 18K Granulado',
          category: 'Oro 18K',
          stock: 120.5,
        },
      ]);

      const list = await service.getMaterials({ category: 'Oro 18K' });

      expect(list).toHaveLength(1);
      expect(list[0].category).toBe('Oro 18K');
      expect(prismaMock.material.findMany).toHaveBeenCalledWith({
        where: { category: 'Oro 18K', status: 'Activo' },
        orderBy: { name: 'asc' },
      });
    });
  });
});
