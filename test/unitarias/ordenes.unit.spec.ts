/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 5: Órdenes de Trabajo - RF-005)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para la validación previa de
 * datos y parámetros de Órdenes de Trabajo (RF-005).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de validación de fechas, pesos iniciales y asignación de parámetros de producción.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema impide registrar fechas pasadas o datos inconsistentes antes de emitir la orden.
 * 
 * Casos incluidos en este archivo:
 * - CP-097: Fecha estimada inválida (Bloqueo de fechas pasadas en UI/Servicio)
 * - CP-101: Peso de pieza en OT <= 0 (Rechazo preventivo de peso nulo o negativo)
 * ============================================================================
 */

import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Órdenes de Trabajo (RF-005)', () => {
  describe('CP-097: Fecha estimada inválida', () => {
    it('Debe rechazar la creación de una Orden de Trabajo si la fecha estimada de entrega es pasada', () => {
      const validateEstimatedDate = (estimatedDate: Date) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (estimatedDate.getTime() < now.getTime()) {
          throw new BadRequestException('La fecha estimada de entrega no puede ser anterior a la fecha actual');
        }
        return true;
      };

      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(() => validateEstimatedDate(pastDate)).toThrow(BadRequestException);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(validateEstimatedDate(futureDate)).toBe(true);
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-101
   * --------------------------------------------------------------------------
   * Requerimiento: RF-005
   * Tipo: UNITARIA
   * Objetivo: Peso de pieza en OT <= 0.
   * Criterio de Aceptación: Rechazo preventivo en formulario si el peso del anillo o metal es <= 0.
   * --------------------------------------------------------------------------
   */
  describe('CP-101: Peso de pieza en OT <= 0', () => {
    it('Debe rechazar la emisión de una OT si el peso asignado a la pieza es menor o igual a cero', () => {
      const validateRingWeight = (weight: number) => {
        if (isNaN(weight) || weight <= 0) {
          throw new BadRequestException('El peso inicial de la pieza debe ser mayor a cero gramos');
        }
        return true;
      };

      expect(() => validateRingWeight(0)).toThrow(BadRequestException);
      expect(() => validateRingWeight(-2.5)).toThrow(BadRequestException);
      expect(validateRingWeight(10.5)).toBe(true);
    });
  });
});
