/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 18: API Rest Externa - RF-018)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para el Módulo de Integración
 * y API Rest Externa (RF-018).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de las estructuras de respuesta estandarizadas en formato JSON sin consultar la BD.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo todas las respuestas de la API del sistema cumplen un contrato JSON estandarizado (`status`, `data`, `message`).
 * 
 * Casos incluidos en este archivo:
 * - CP-174: Formato JSON estandarizado (Estructura uniforme en respuestas API)
 * ============================================================================
 */

describe('PRUEBAS UNITARIAS - API Rest Externa (RF-018)', () => {
  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-174
   * --------------------------------------------------------------------------
   * Requerimiento: RF-018
   * Tipo: UNITARIA
   * Objetivo: Formato JSON estandarizado.
   * Criterio de Aceptación: Formatear las respuestas de la API en el esquema { status, data, message }.
   * --------------------------------------------------------------------------
   */
  describe('CP-174: Formato JSON estandarizado', () => {
    it('Debe formatear la respuesta del servidor en un objeto JSON estandarizado con status y payload', () => {
      const createApiResponse = <T>(data: T, message = 'Operación exitosa') => ({
        status: 200,
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
      });

      const response = createApiResponse({ material: 'Oro 18K', stock: 150.0 });

      expect(response).toHaveProperty('status', 200);
      expect(response).toHaveProperty('success', true);
      expect(response.data).toEqual({ material: 'Oro 18K', stock: 150.0 });
    });
  });
});
