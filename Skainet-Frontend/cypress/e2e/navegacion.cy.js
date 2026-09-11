// cypress/e2e/navegacion.cy.js
// Pruebas de navegación del panel principal (tabs/secciones)

import usuarios from '../fixtures/usuarios.json';

describe('🧭 Navegación del Panel', () => {
  beforeEach(() => {
    cy.login(usuarios.admin.name, usuarios.admin.password);
  });

  it('muestra el panel principal tras login', () => {
    // Verifica que hay botones de navegación de tabs
    cy.get('button', { timeout: 8000 }).should('have.length.greaterThan', 2);
  });

  it('puede cerrar sesión', () => {
    cy.get('button').filter(':visible').then(($buttons) => {
      // Busca botón de cerrar sesión por ícono o texto
      const logoutBtn = [...$buttons].find(
        b => b.textContent.match(/salir|cerrar|logout/i) || b.querySelector('svg')
      );
      if (logoutBtn) cy.wrap(logoutBtn).click();
    });
    cy.contains('IDENTIFICACIÓN SKYNET').should('be.visible');
  });
});
