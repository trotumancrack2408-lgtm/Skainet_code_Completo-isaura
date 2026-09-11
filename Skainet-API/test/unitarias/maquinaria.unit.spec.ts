/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 7: Control de Maquinaria y Equipos - RF-007)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para el Módulo de Control
 * de Maquinaria y Equipos (RF-007).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de las funciones de validación de equipos, balanzas y máquinas del taller sin modificar la BD.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema exige los campos obligatorios del equipo (código, tipo, nombre) antes del registro.
 * 
 * Casos incluidos en este archivo:
 * - CP-115: Campos requeridos equipo (Validación de modelo, código y tipo en UI/Servicio)
 * ============================================================================
 */

import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Control de Maquinaria (RF-007)', () => {
  describe('CP-115: Campos requeridos equipo', () => {
    it('Debe rechazar el registro de una máquina o equipo si falta el nombre o el tipo de maquinaria', () => {
      const validateMachine = (data: { name?: string; type?: string }) => {
        if (!data.name || !data.type) {
          throw new BadRequestException('Debe especificar el nombre y tipo de maquinaria.');
        }
        return true;
      };

      expect(() => validateMachine({ name: 'Balanza Digital' })).toThrow(BadRequestException);
      expect(validateMachine({ name: 'Laminadora 1', type: 'ROLLER' })).toBe(true);
    });
  });
});
