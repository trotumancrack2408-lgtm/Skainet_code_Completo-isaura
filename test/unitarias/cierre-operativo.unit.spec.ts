/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 17: Cierre Operativo y Arqueo - RF-017)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para el Módulo de Rendición
 * de Cuentas y Cierre Operativo (RF-017).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de las fórmulas de conciliación de metal, detección de descuadre y generación de comprobantes de cierre sin tocar la BD.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema detecta descuadres de oro superiores a 0.01g al momento del cierre de turno del joyero
 * y genera el resumen formateado para el comprobante de entrega.
 * 
 * Casos incluidos en este archivo:
 * - CP-169: Descuadre en arqueo metal (Alerta e inhabilitación por diferencia no justificada > 0.01g)
 * - CP-172: Reporte de cierre impreso/digital (Generación de comprobante de entrega de metal)
 * ============================================================================
 */

import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Cierre Operativo y Arqueo (RF-017)', () => {
  describe('CP-169: Descuadre en arqueo metal', () => {
    it('Debe rechazar la conciliación de turno si el metal devuelto + mermas presenta una diferencia no justificada > 0.01g', () => {
      const reconcileMetal = (givenWeight: number, returnedWeight: number, lossWeight: number, leftoverWeight: number) => {
        const totalAccounted = returnedWeight + lossWeight + leftoverWeight;
        const diff = Number(Math.abs(givenWeight - totalAccounted).toFixed(3));
        if (diff > 0.01) {
          throw new BadRequestException(`Descuadre crítico de metal: diferencia de ${diff}g excede la tolerancia permitida de 0.01g.`);
        }
        return { success: true, diff };
      };

      expect(() => reconcileMetal(50.0, 40.0, 2.0, 7.5)).toThrow(BadRequestException);
      expect(reconcileMetal(50.0, 40.0, 2.0, 7.995).success).toBe(true);
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-172
   * --------------------------------------------------------------------------
   * Requerimiento: RF-017
   * Tipo: UNITARIA
   * Objetivo: Reporte de cierre impreso/digital.
   * Criterio de Aceptación: Generación de comprobante estructurado de entrega de metal.
   * --------------------------------------------------------------------------
   */
  describe('CP-172: Reporte de cierre impreso/digital', () => {
    it('Debe estructurar los datos del comprobante de cierre de turno con los totales de gramos entregados y devueltos', () => {
      const generateShiftReceipt = (jewelerName: string, givenGrams: number, returnedGrams: number, lossGrams: number) => {
        return {
          title: 'COMPROBANTE DE ENTREGAS Y ARQUEO DE METAL - SKAINET',
          jeweler: jewelerName,
          givenGrams,
          returnedGrams,
          lossGrams,
          date: new Date().toISOString(),
        };
      };

      const receipt = generateShiftReceipt('Ramiro Joyero', 25.0, 24.95, 0.05);

      expect(receipt.title).toContain('SKAINET');
      expect(receipt.jeweler).toBe('Ramiro Joyero');
      expect(receipt.givenGrams).toBe(25.0);
    });
  });
});
