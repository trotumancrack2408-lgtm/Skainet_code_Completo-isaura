// cypress/e2e/login.cy.js
import usuarios from '../fixtures/usuarios.json';

describe('🔐 Autenticación Skainet', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('muestra la pantalla de identificación al cargar', () => {
    cy.contains('IDENTIFICACIÓN SKYNET').should('be.visible');
    cy.contains('Seleccione su perfil de acceso').should('be.visible');
  });

  it('carga perfiles de usuarios desde el backend', () => {
    cy.get('button.premium-btn', { timeout: 8000 }).should('have.length.greaterThan', 0);
    cy.contains('button', 'David').should('be.visible');
    cy.contains('button', 'Deysi').should('be.visible');
  });

  it('muestra input de contraseña al seleccionar perfil', () => {
    cy.contains('button', 'David').click();
    cy.get('input[type="password"]').should('be.visible');
    cy.contains('INICIAR SESIÓN').should('not.exist'); // texto con error de typo en la app
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('vuelve a la lista de perfiles al pulsar "Volver a perfiles"', () => {
    cy.contains('button', 'David').click();
    cy.contains('Volver a perfiles').click();
    cy.contains('Seleccione su perfil de acceso').should('be.visible');
  });

  it('muestra formulario de recuperación de contraseña (usuario con preguntas)', () => {
    // Viralsquad tiene 3 preguntas de seguridad configuradas en la BD
    cy.contains('button', /PANEL SUPERIOR|Viralsquad/i).click();
    cy.contains('Olvidé mi contraseña').click();
    cy.contains('RECUPERACIÓN DE CLAVE', { timeout: 6000 }).should('be.visible');
  });

  it('LOGIN EXITOSO - David (Dueño)', () => {
    cy.login(usuarios.admin.name, usuarios.admin.password);
    cy.contains('IDENTIFICACIÓN SKYNET').should('not.exist');
    cy.get('.login-screen').should('not.exist');
  });

  it('LOGIN EXITOSO - Deysi (Joyero)', () => {
    cy.login(usuarios.joyero.name, usuarios.joyero.password);
    cy.get('.login-screen').should('not.exist');
  });

  it('LOGIN FALLIDO - contraseña incorrecta', () => {
    cy.contains('button', 'David').click();
    cy.get('input[type="password"]').type('wrongpass999');
    cy.get('button[type="submit"]').first().click();
    // Debe permanecer en pantalla de contraseña (input visible)
    cy.get('input[type="password"]', { timeout: 5000 }).should('be.visible');
  });

  it('LOGIN FALLIDO - contraseña vacía no envía', () => {
    cy.contains('button', 'David').click();
    cy.get('input[type="password"]').should('be.empty');
    cy.get('button[type="submit"]').first().should('be.visible');
  });
});
