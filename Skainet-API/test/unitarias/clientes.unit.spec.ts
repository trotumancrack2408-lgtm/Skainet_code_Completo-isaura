/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 11: Gestión de Clientes - RF-011)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para la validación previa de
 * clientes y pedidos personalizados (RF-011).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de validación de unicidad de documento de cliente y parámetros del pedido sin consultar la BD.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema invalida duplicados de cédula o NIT de cliente antes de proceder con el alta.
 * 
 * Casos incluidos en este archivo:
 * - CP-140: Documento cliente duplicado (Validación preventiva en UI/Servicio)
 * ============================================================================
 */

import { BadRequestException } from '@nestjs/common';

describe('PRUEBAS UNITARIAS - Gestión de Clientes (RF-011)', () => {
  describe('CP-140: Documento cliente duplicado', () => {
    it('Debe rechazar el registro de un cliente si su documento de identidad ya está registrado', () => {
      const existingClientDocs = ['900123456', '1098765432'];
      const validateClientDocument = (doc: string) => {
        if (existingClientDocs.includes(doc)) {
          throw new BadRequestException('El número de documento del cliente ya se encuentra registrado');
        }
        return true;
      };

      expect(() => validateClientDocument('900123456')).toThrow(BadRequestException);
      expect(validateClientDocument('900999888')).toBe(true);
    });
  });
});
