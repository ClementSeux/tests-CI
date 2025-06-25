// Configuration globale pour Jest
const { server } = require("../index");

// Configuration des timeouts
jest.setTimeout(30000);

// Fermeture propre du serveur après tous les tests
afterAll(async () => {
    if (server && server.close) {
        await new Promise((resolve) => {
            server.close(resolve);
        });
    }
});

// Configuration des mocks globaux si nécessaire
global.console = {
    ...console,
    // Masquer les logs pendant les tests sauf si explicitement demandé
    log: process.env.JEST_VERBOSE === "true" ? console.log : jest.fn(),
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
};

// Utilitaires de test globaux
global.testUtils = {
    // Helper pour attendre un délai
    delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

    // Helper pour formater les montants
    formatAmount: (amount) => parseFloat(parseFloat(amount).toFixed(2)),

    // Helper pour valider les réponses d'API
    validateApiResponse: (response, expectedProperties) => {
        expectedProperties.forEach((prop) => {
            expect(response.body).toHaveProperty(prop);
        });
    },
};
