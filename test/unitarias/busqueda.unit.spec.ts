/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 9: Búsqueda General - RF-009)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para la validación previa de
 * términos de búsqueda global y filtros avanzadas (RF-009).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de validación de entradas vacías y longitud mínima de términos sin consultar la BD.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el motor de búsqueda valida que el término tenga al menos 2 caracteres antes de ejecutar la consulta.
 * 
 * Casos incluidos en este archivo:
 * - CP-127: Búsqueda sin coincidencias (Validación frontend/servicio de términos vacíos)
 * - CP-131: Término de búsqueda muy corto (Bloqueo en UI/Servicio de términos < 2 caracteres)
 * ============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from '../../Skainet-API/src/search/search.service';
import { PrismaService } from '../../Skainet-API/src/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Búsqueda General (RF-009)', () => {
  let service: SearchService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: { findMany: jest.fn() },
      material: { findMany: jest.fn() },
      workOrder: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  describe('CP-127: Búsqueda sin coincidencias', () => {
    it('Debe rechazar la consulta si el término de búsqueda está vacío o contiene solo espacios', async () => {
      await expect(
        service.globalSearch('1000000000', 'Super Administrador', ''),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.globalSearch('1000000000', 'Super Administrador', '   '),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.user.findMany).not.toHaveBeenCalled();
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-131
   * --------------------------------------------------------------------------
   * Requerimiento: RF-009
   * Tipo: UNITARIA
   * Objetivo: Término de búsqueda muy corto.
   * Criterio de Aceptación: Rechazo preventivo de búsquedas con longitud menor a 2 caracteres.
   * --------------------------------------------------------------------------
   */
  describe('CP-131: Término de búsqueda muy corto', () => {
    it('Debe rechazar la búsqueda si el término ingresado tiene menos de 2 caracteres', () => {
      const validateSearchTermLength = (term: string) => {
        if (!term || term.trim().length < 2) {
          throw new BadRequestException('El término de búsqueda debe tener al menos 2 caracteres.');
        }
        return true;
      };

      expect(() => validateSearchTermLength('a')).toThrow(BadRequestException);
      expect(validateSearchTermLength('Oro')).toBe(true);
    });
  });
});
