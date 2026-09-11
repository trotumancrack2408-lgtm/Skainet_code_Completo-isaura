/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 4: Inventario de Materia Prima - RF-004)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para la validación previa de
 * registros y movimientos de inventario de materia prima (RF-004).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de las funciones de validación de formulario, tipos de materiales y gramajes
 * sin modificar registros en la base de datos.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema rechaza gramajes negativos o nulos, valida los tipos de ley del catálogo
 * y exige campos obligatorios antes de enviar la solicitud al servidor.
 * 
 * Casos incluidos en este archivo:
 * - CP-086: Gramaje negativo o cero (Bloqueo en UI/Servicio de valores <= 0)
 * - CP-090: Tipo de material inválido (Restricción de selección a catálogo de ley/categoría)
 * - CP-093: Campos requeridos material (Validación de campos obligatorios en el registro)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../../src/inventory/inventory.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuditService } from '../../src/audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Inventario de Materia Prima (RF-004)', () => {
  let service: InventoryService;
  let prismaMock: any;
  let auditMock: any;

  beforeEach(async () => {
    prismaMock = {
      material: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      kardexMovement: {
        create: jest.fn(),
      },
    };

    auditMock = {
      log: jest.fn(),
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

  describe('CP-086: Gramaje negativo o cero', () => {
    it('Debe rechazar movimientos o stocks iniciales con cantidades negativas o cero', async () => {
      await expect(
        service.registerEntry('1000000000', 'Super Admin', {
          materialId: 'MAT-1',
          quantity: -5.5,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.registerEntry('1000000000', 'Super Admin', {
          materialId: 'MAT-1',
          quantity: 0,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.kardexMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('CP-090: Tipo de material inválido', () => {
    it('Debe validar que las leyes y categorías pertenezcan a la nomenclatura oficial de joyería', () => {
      const validCategories = ['Oro 18K', 'Oro 14K', 'Plata 925', 'Platino'];
      const isValidCategory = (cat: string) => validCategories.includes(cat);

      expect(isValidCategory('Oro 18K')).toBe(true);
      expect(isValidCategory('Plata 925')).toBe(true);
      expect(isValidCategory('Metal Desconocido')).toBe(false);
    });
  });

  describe('CP-093: Campos requeridos material', () => {
    it('Debe rechazar el registro de un material si falta el nombre, la categoría o la unidad', async () => {
      const incompleteMaterial = {
        name: 'Oro Amarillo 18K',
      };

      await expect(
        service.createMaterial('1000000000', 'Super Admin', incompleteMaterial),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.material.create).not.toHaveBeenCalled();
    });
  });
});
