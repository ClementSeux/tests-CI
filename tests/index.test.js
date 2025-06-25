// Fichier de test principal - Point d'entrée pour tous les tests
const request = require("supertest");
const { app } = require("../index");

describe("Microservice de Conversion et Calculs Financiers", () => {
    describe("Tests de base", () => {
        test("le serveur devrait démarrer correctement", () => {
            expect(app).toBeDefined();
        });

        test("devrait exposer les bonnes routes", async () => {
            // Test que toutes les routes principales sont accessibles
            const routes = ["/health", "/rates"];

            for (const route of routes) {
                const response = await request(app).get(route);
                expect(response.status).not.toBe(404);
            }
        });
    });

    describe("Conformité aux spécifications", () => {
        test("devrait respecter le format de réponse pour /convert", async () => {
            const response = await request(app)
                .get("/convert?from=EUR&to=USD&amount=100")
                .expect(200);

            // Vérification du format exact selon le cahier des charges
            expect(response.body).toEqual({
                from: "EUR",
                to: "USD",
                originalAmount: 100,
                convertedAmount: 110,
            });
        });

        test("devrait respecter le format de réponse pour /tva", async () => {
            const response = await request(app)
                .get("/tva?ht=100&taux=20")
                .expect(200);

            // Vérification du format exact selon le cahier des charges
            expect(response.body).toEqual({
                ht: 100,
                taux: 20,
                ttc: 120,
            });
        });

        test("devrait respecter le format de réponse pour /remise", async () => {
            const response = await request(app)
                .get("/remise?prix=100&pourcentage=10")
                .expect(200);

            // Vérification du format exact selon le cahier des charges
            expect(response.body).toEqual({
                prixInitial: 100,
                pourcentage: 10,
                prixFinal: 90,
            });
        });

        test("devrait respecter les taux de conversion fixés", async () => {
            // 1 EUR = 1.1 USD
            const eurToUsd = await request(app)
                .get("/convert?from=EUR&to=USD&amount=1")
                .expect(200);
            expect(eurToUsd.body.convertedAmount).toBe(1.1);

            // 1 USD = 0.8 GBP
            const usdToGbp = await request(app)
                .get("/convert?from=USD&to=GBP&amount=1")
                .expect(200);
            expect(usdToGbp.body.convertedAmount).toBe(0.8);
        });
    });

    describe("Validation des entrées selon le cahier des charges", () => {
        test("devrait rejeter les montants négatifs", async () => {
            const responses = await Promise.all([
                request(app).get("/convert?from=EUR&to=USD&amount=-100"),
                request(app).get("/tva?ht=-100&taux=20"),
                request(app).get("/remise?prix=-100&pourcentage=10"),
            ]);

            responses.forEach((response) => {
                expect(response.status).toBe(400);
            });
        });

        test("devrait valider les paramètres requis", async () => {
            const invalidRequests = [
                "/convert?from=EUR&to=USD", // amount manquant
                "/convert?from=EUR&amount=100", // to manquant
                "/convert?to=USD&amount=100", // from manquant
                "/tva?ht=100", // taux manquant
                "/tva?taux=20", // ht manquant
                "/remise?prix=100", // pourcentage manquant
                "/remise?pourcentage=10", // prix manquant
            ];

            for (const invalidRequest of invalidRequests) {
                const response = await request(app).get(invalidRequest);
                expect(response.status).toBe(400);
            }
        });
    });

    describe("Tests de robustesse", () => {
        test("devrait gérer les conversions non supportées", async () => {
            const response = await request(app)
                .get("/convert?from=EUR&to=JPY&amount=100")
                .expect(400);

            expect(response.body.error).toContain("Conversion non supportée");
        });

        test("devrait gérer les valeurs extrêmes", async () => {
            // Test avec de très grandes valeurs
            const largeValueResponse = await request(app)
                .get("/convert?from=EUR&to=USD&amount=999999999")
                .expect(200);

            expect(largeValueResponse.body.convertedAmount).toBe(1099999998.9);

            // Test avec de très petites valeurs
            const smallValueResponse = await request(app)
                .get("/convert?from=EUR&to=USD&amount=0.01")
                .expect(200);

            expect(smallValueResponse.body.convertedAmount).toBe(0.01);
        });
    });
});
