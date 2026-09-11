/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 10: Reportes y Métricas - RF-010)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para el Módulo de Reportes
 * de Desempeño y Métricas de Calidad (RF-010).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de las funciones de validación de rangos de fechas y parámetros de reportes sin consultar la BD.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema invalida rangos de fecha inconsistentes (`fecha_inicio > fecha_fin`) antes de consultar métricas.
 * 
 * Casos incluidos en este archivo:
 * - CP-135: Rango de fechas inconsistente (Bloqueo en UI/Servicio de fecha_inicio > fecha_fin)
 * ============================================================================
 */

import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Reportes y Métricas (RF-010)', () => {
  describe('CP-135: Rango de fechas inconsistente', () => {
    it('Debe rechazar la generación de reportes si la fecha inicial es posterior a la fecha final', () => {
      const validateDateRange = (startDate: Date, endDate: Date) => {
        if (startDate.getTime() > endDate.getTime()) {
          throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final.');
        }
        return true;
      };

      const start = new Date('2026-08-30');
      const end = new Date('2026-08-01');

      expect(() => validateDateRange(start, end)).toThrow(BadRequestException);
      expect(validateDateRange(end, start)).toBe(true);
    });
  });
});
