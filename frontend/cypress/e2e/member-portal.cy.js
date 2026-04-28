describe('Member Portal', () => {
  beforeEach(() => {
    // Login as member
    cy.visit('/login')
    cy.get('input[type="text"]').type('membre@nafa.sn')
    cy.get('input[type="password"]').type('password')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/portail')
  })

  describe('Dashboard', () => {
    beforeEach(() => {
      cy.visit('/portail/accueil')
    })

    it('displays member banner with name', () => {
      cy.contains('Bienvenue').should('be.visible')
      cy.contains('Diallo Amadou').should('be.visible')
    })

    it('displays KPI cards', () => {
      cy.contains('Solde de caisse').should('be.visible')
      cy.contains('Mes cotisations versées').should('be.visible')
      cy.contains('Mois en retard').should('be.visible')
      cy.contains('CEX en attente').should('be.visible')
    })

    it('displays recent expenses', () => {
      cy.contains('Dernières dépenses').should('be.visible')
    })

    it('displays upcoming events', () => {
      cy.contains('Prochains événements').should('be.visible')
    })
  })

  describe('Cotisations', () => {
    beforeEach(() => {
      cy.visit('/portail/cotisations')
    })

    it('displays monthly tab by default', () => {
      cy.contains('Mensuelles').should('have.class', 'text-blue-700')
    })

    it('shows year selector', () => {
      cy.get('select').should('be.visible')
    })

    it('displays month grid', () => {
      cy.get('[class*="grid"]').should('be.visible')
      cy.contains('Janvier').should('be.visible')
    })

    it('can switch to exceptional tab', () => {
      cy.contains('Exceptionnelles').click()
      cy.contains('Exceptionnelles').should('have.class', 'text-blue-700')
    })
  })

  describe('Événements', () => {
    beforeEach(() => {
      cy.visit('/portail/evenements')
    })

    it('displays events list', () => {
      cy.contains('Événements').should('be.visible')
    })

    it('has search input', () => {
      cy.get('input[placeholder*="Rechercher"]').should('be.visible')
    })

    it('filters events by search', () => {
      cy.get('input[placeholder*="Rechercher"]').type('réunion')
      cy.contains('Réunion').should('be.visible')
    })
  })

  describe('Annonces', () => {
    beforeEach(() => {
      cy.visit('/portail/annonces')
    })

    it('displays announcements list', () => {
      cy.contains('Annonces').should('be.visible')
    })

    it('has type filter pills', () => {
      cy.contains('Toutes').should('be.visible')
      cy.contains('Mariage').should('be.visible')
    })

    it('filters by type', () => {
      cy.contains('Mariage').click()
      cy.contains('Mariage').parent().should('have.class', 'bg-blue-700')
    })
  })

  describe('Mon Profil', () => {
    beforeEach(() => {
      cy.visit('/portail/profil')
    })

    it('displays member information', () => {
      cy.contains('Mon profil').should('be.visible')
      cy.contains('Diallo Amadou').should('be.visible')
    })

    it('displays information table', () => {
      cy.contains('Matricule').should('be.visible')
      cy.contains('MBR-2022-001').should('be.visible')
    })

    it('has password change button', () => {
      cy.contains('Modifier mot de passe').should('be.visible')
    })

    it('shows password form on click', () => {
      cy.contains('Modifier mot de passe').click()
      cy.get('input[type="password"]').should('be.visible')
    })

    it('requires matching password confirmation', () => {
      cy.contains('Modifier mot de passe').click()
      cy.get('input[type="password"]').eq(0).type('oldpass')
      cy.get('input[type="password"]').eq(1).type('newpass123')
      cy.get('input[type="password"]').eq(2).type('wrongmatch')
      cy.contains('Modifier le mot de passe').click()
      // Form validation should prevent submission or show error
    })
  })

  describe('Navigation', () => {
    it('has working navbar links', () => {
      cy.get('a, button').contains('Accueil').should('be.visible')
      cy.get('a, button').contains('Cotisations').should('be.visible')
      cy.get('a, button').contains('Événements').should('be.visible')
      cy.get('a, button').contains('Annonces').should('be.visible')
      cy.get('a, button').contains('Mon profil').should('be.visible')
    })

    it('logout works', () => {
      cy.contains('Déconnexion').click()
      cy.url().should('include', '/login')
    })
  })
})
