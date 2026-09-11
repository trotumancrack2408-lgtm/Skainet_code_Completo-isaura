// Comando reutilizable: cy.login('Nombre', 'contraseña')
// Busca el botón con el nombre del usuario y escribe la contraseña
Cypress.Commands.add('login', (nombre, password) => {
  cy.visit('/');
  // Espera a que carguen los botones de perfil
  cy.contains('button', nombre, { timeout: 8000 }).click();
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').first().click();
});
