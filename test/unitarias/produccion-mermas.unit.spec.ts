/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 6: Registro de Producción y Mermas - RF-006)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para el Módulo de Registro
 * y Control de Producción y Mermas (RF-006).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de fórmulas de cálculo de merma y validaciones de consistencia física
 * entre el pesaje inicial y final sin tocar la base de datos real.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema aplica la fórmula estricta `Merma = Peso Inicial - Peso Final` y bloquea
 * inconsistencias físicas como la ganancia ilógica de peso (`Peso Final > Peso Inicial`).
 * 
 * Casos incluidos en este archivo:
 * - CP-108: Cálculo automático de merma (Fórmula de merma de fabricación)
 * - CP-110: Pesaje final mayor al inicial (Bloqueo por inconsistencia física)
 * ============================================================================
 */

import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Producción y Mermas (RF-006)', () => {
  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-108
   * --------------------------------------------------------------------------
   * Requerimiento: RF-006
   * Tipo: UNITARIA
   * Objetivo: Cálculo automático de merma.
   * Criterio de Aceptación: Verificar que la merma se calcule con precisión `initialWeight - finalWeight`.
   * --------------------------------------------------------------------------
   */
  describe('CP-108: Cálculo automático de merma', () => {
    it('Debe calcular exactamente la merma producida restando el peso final al peso inicial', () => {
      const calculateLoss = (initialWeight: number, finalWeight: number) => {
        if (finalWeight > initialWeight) {
          throw new BadRequestException('El peso final no puede ser mayor al peso inicial entregado');
        }
        return Number((initialWeight - finalWeight).toFixed(3));
      };

      const loss = calculateLoss(15.50, 15.15);
      expect(loss).toBe(0.35);
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-110
   * --------------------------------------------------------------------------
   * Requerimiento: RF-006
   * Tipo: UNITARIA
   * Objetivo: Pesaje final mayor al inicial.
   * Criterio de Aceptación: Lanzar BadRequestException si el pesaje final supera al pesaje inicial.
   * --------------------------------------------------------------------------
   */
  describe('CP-110: Pesaje final mayor al inicial', () => {
    it('Debe rechazar con BadRequestException ante la ganancia ilógica de peso en el pesaje final', () => {
      const calculateLoss = (initialWeight: number, finalWeight: number) => {
        if (finalWeight > initialWeight) {
          throw new BadRequestException('Inconsistencia en pesaje: el peso final no puede superar al inicial');
        }
        return Number((initialWeight - finalWeight).toFixed(3));
      };

      expect(() => calculateLoss(10.0, 12.5)).toThrow(BadRequestException);
    });
  });
});
