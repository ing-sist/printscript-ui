

export function loginViaAuth0Ui(username: string, password: string) {
  const frontendUrl = Cypress.env('FRONTEND_URL') || 'http://localhost:8080';
  const auth0Domain = Cypress.env('auth0_domain');

  cy.visit(frontendUrl);

  cy.origin(
    auth0Domain,
    { args: { username, password } },
    ({ username, password }) => {
      const tryAcceptConsent = () => {
        cy.contains('button', /Accept|Continue/i, { timeout: 2000 }).click({ force: true });
      };

      cy.location('pathname', { timeout: 5000 }).then((path) => {
        if (path.includes('/u/login') || path.includes('/authorize')) {
          cy.get('input#username').type(username);
          cy.get('input#password').type(password, { log: false });
          cy.contains('button[value=default]', /Continue/i).click();
          cy.location('pathname', { timeout: 5000 }).then((p) => {
            if (p.includes('/u/consent')) {
              tryAcceptConsent();
            }
          });
        } else if (path.includes('/u/consent')) {
          tryAcceptConsent();
        }
      });
    }
  );

  cy.url().should('include', frontendUrl);
}
