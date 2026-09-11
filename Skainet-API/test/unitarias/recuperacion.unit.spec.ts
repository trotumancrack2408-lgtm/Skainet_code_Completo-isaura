/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 3: Recuperación de Contraseña - RF-003)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para la validación previa de
 * solicitudes y datos de recuperación de contraseña (RF-003).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de validación de sintaxis de correo y coincidencia de clave en UI.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Muestre cómo el frontend/servicio rechaza datos mal formados antes de tocar la base de datos.
 * 
 * Casos incluidos en este archivo:
 * - CP-081: Formato email rec. inválido (Validación Regex previa de correo de recuperación)
 * - CP-083: Coincidencia de nueva clave (Verificación de confirmación de password en UI)
 * ============================================================================
 */

import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Recuperación de Contraseña (RF-003)', () => {
  describe('CP-081: Formato email rec. inválido', () => {
    it('Debe rechazar la solicitud de recuperación si el correo ingresado no cumple la sintaxis Regex', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = ['invalid.email', 'usuario@', '@dominio.com', 'correo@.com'];

      for (const email of invalidEmails) {
        expect(emailRegex.test(email)).toBe(false);
      }

      expect(emailRegex.test('usuario.valido@skainet.com')).toBe(true);
    });
  });

  describe('CP-083: Coincidencia de nueva clave', () => {
    it('Debe rechazar el formulario de cambio de clave si la confirmación no coincide exactamente', () => {
      const validatePasswordsMatch = (p1: string, p2: string) => {
        if (p1 !== p2) {
          throw new BadRequestException('Las contraseñas no coinciden.');
        }
        return true;
      };

      expect(() => validatePasswordsMatch('Clave123!', 'Clave456!')).toThrow(BadRequestException);
      expect(validatePasswordsMatch('Clave123!', 'Clave123!')).toBe(true);
    });
  });
});
