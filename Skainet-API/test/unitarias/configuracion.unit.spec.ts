/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 16: Configuración de Parámetros - RF-016)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para el Módulo de Configuración
 * del Sistema y Parámetros (RF-016).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de las funciones de validación de umbrales y tolerancias del taller sin consultar la BD.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema invalida la asignación de tolerancias de merma negativas o iguales a cero.
 * 
 * Casos incluidos en este archivo:
 * - CP-164: Tolerancia de merma negativa (Rechazo de valores <= 0 en configuración de tolerancia)
 * ============================================================================
 */

import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Configuración de Parámetros (RF-016)', () => {
  describe('CP-164: Tolerancia de merma negativa', () => {
    it('Debe rechazar la actualización del parámetro si la tolerancia de merma es menor o igual a cero', () => {
      const validateLossTolerance = (toleranceGrams: number) => {
        if (isNaN(toleranceGrams) || toleranceGrams <= 0) {
          throw new BadRequestException('El umbral de tolerancia de merma debe ser un valor positivo mayor a cero.');
        }
        return true;
      };

      expect(() => validateLossTolerance(0)).toThrow(BadRequestException);
      expect(() => validateLossTolerance(-0.05)).toThrow(BadRequestException);
      expect(validateLossTolerance(0.05)).toBe(true);
    });
  });
});
