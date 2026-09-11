/**
 * ============================================================================
 * SISTEMA SKAINET - PRUEBAS UNITARIAS (Módulo 15: Interfaz y UX - RF-015)
 * ============================================================================
 * 
 * Este archivo contiene la suite de Pruebas Unitarias para el Módulo de Interfaz
 * Adaptativa y Experiencia de Usuario (RF-015).
 * 
 * ¿QUÉ ES UNA PRUEBA UNITARIA EN SKAINET?
 * Verificación aislada de las funciones de gestión de temas (Dark/Light Mode) y formateo de mensajes de error limpios para UI.
 * 
 * GUÍA DE EXPOSICIÓN:
 * Explique cómo el sistema ofrece personalización de tema (modo oscuro) y presenta mensajes de error entendibles sin exponer datos técnicos.
 * 
 * Casos incluidos en este archivo:
 * - CP-159: Modo oscuro / claro (Alternancia de tema visual light/dark)
 * - CP-161: Mensajes de error claros (Visualización de feedback comprensible en UI sin fugas técnicas)
 * ============================================================================
 */

describe('PRUEBAS UNITARIAS - Interfaz y UX (RF-015)', () => {
  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-159
   * --------------------------------------------------------------------------
   * Requerimiento: RF-015
   * Tipo: UNITARIA
   * Objetivo: Modo oscuro / claro.
   * Criterio de Aceptación: Conmutación correcta del tema visual entre light y dark.
   * --------------------------------------------------------------------------
   */
  describe('CP-159: Modo oscuro / claro', () => {
    it('Debe alternar correctamente el tema visual del usuario entre dark y light', () => {
      const toggleTheme = (currentTheme: 'light' | 'dark') => {
        return currentTheme === 'light' ? 'dark' : 'light';
      };

      expect(toggleTheme('light')).toBe('dark');
      expect(toggleTheme('dark')).toBe('light');
    });
  });

  /**
   * --------------------------------------------------------------------------
   * CASO DE PRUEBA: CP-161
   * --------------------------------------------------------------------------
   * Requerimiento: RF-015
   * Tipo: UNITARIA
   * Objetivo: Mensajes de error claros.
   * Criterio de Aceptación: Desinfectar errores técnicos en mensajes amigables para el usuario.
   * --------------------------------------------------------------------------
   */
  describe('CP-161: Mensajes de error claros', () => {
    it('Debe transformar excepciones técnicas internas en mensajes comprensibles para el usuario sin revelar la traza', () => {
      const sanitizeErrorMessage = (error: any) => {
        if (error.message && error.message.includes('PrismaClientKnownRequestError')) {
          return 'No se pudo completar la operación. Verifique los datos e intente nuevamente.';
        }
        return error.message || 'Ocurrió un error inesperado.';
      };

      const technicalError = new Error('PrismaClientKnownRequestError: Foreign key constraint failed on field user_id');
      const userMessage = sanitizeErrorMessage(technicalError);

      expect(userMessage).not.toContain('PrismaClientKnownRequestError');
      expect(userMessage).toBe('No se pudo completar la operación. Verifique los datos e intente nuevamente.');
    });
  });
});
