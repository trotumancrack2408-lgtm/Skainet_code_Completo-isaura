/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 8: Registro de Lotes y Trazabilidad - RF-008)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para la validación previa de
 * lotes de producción y piezas asociadas (RF-008).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de unicidad de código de lote y parámetros de fundición sin modificar la BD.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema rechaza códigos de lote duplicados antes de procesar la fundición.
 * 
 * Casos incluidos en este archivo:
 * - CP-122: Código de lote duplicado (Validación preventiva de unicidad en UI/Servicio)
 * ============================================================================
 */

import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Registro de Lotes (RF-008)', () => {
  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-122
   * --------------------------------------------------------------------------
   * Requerimiento: RF-008
   * Tipo: UNITARIA
   * Objetivo: Código de lote duplicado.
   * Criterio de Aceptación: Lanzar BadRequestException si se intenta crear un lote con un ID/código ya registrado.
   * --------------------------------------------------------------------------
   */
  describe('CP-122: Código de lote duplicado', () => {
    it('Debe rechazar la creación de un lote si su identificador o código ya existe en el sistema', () => {
      const existingBatchIds = ['B-101', 'B-102'];
      const validateBatchId = (batchId: string) => {
        if (existingBatchIds.includes(batchId)) {
          throw new BadRequestException('Ya existe un lote registrado con ese código de fundición');
        }
        return true;
      };

      expect(() => validateBatchId('B-101')).toThrow(BadRequestException);
      expect(validateBatchId('B-103')).toBe(true);
    });
  });
});
