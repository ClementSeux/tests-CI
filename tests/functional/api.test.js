const request = require("supertest");
const { app } = require("../../index");

describe("API Routes - Tests Fonctionnels", () => {
    describe("GET /convert", () => {
        test("devrait convertir EUR vers USD avec succès", async () => {
            const response = await request(app)
                .get("/convert?from=EUR&to=USD&amount=100")
                .expect(200);

            expect(response.body).toEqual({
                from: "EUR",
                to: "USD",
                originalAmount: 100,
                convertedAmount: 110,
            });
        });

        test("devrait convertir USD vers GBP avec succès", async () => {
            const response = await request(app)
                .get("/convert?from=USD&to=GBP&amount=100")
                .expect(200);

            expect(response.body).toEqual({
                from: "USD",
                to: "GBP",
                originalAmount: 100,
                convertedAmount: 80,
            });
        });

        test("devrait retourner une erreur 400 pour des paramètres manquants", async () => {
            const response = await request(app)
                .get("/convert?from=EUR&to=USD")
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body).toHaveProperty("code", "CONVERSION_ERROR");
        });

        test("devrait retourner une erreur 400 pour une conversion non supportée", async () => {
            const response = await request(app)
                .get("/convert?from=EUR&to=JPY&amount=100")
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("Conversion non supportée");
        });

        test("devrait retourner une erreur 400 pour un montant négatif", async () => {
            const response = await request(app)
                .get("/convert?from=EUR&to=USD&amount=-100")
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("nombre positif");
        });

        test("devrait gérer les nombres décimaux", async () => {
            const response = await request(app)
                .get("/convert?from=EUR&to=USD&amount=99.99")
                .expect(200);

            expect(response.body.originalAmount).toBe(99.99);
            expect(response.body.convertedAmount).toBe(109.99);
        });
    });

    describe("GET /tva", () => {
        test("devrait calculer la TVA avec succès", async () => {
            const response = await request(app)
                .get("/tva?ht=100&taux=20")
                .expect(200);

            expect(response.body).toEqual({
                ht: 100,
                taux: 20,
                ttc: 120,
            });
        });

        test("devrait calculer la TVA avec taux 0%", async () => {
            const response = await request(app)
                .get("/tva?ht=100&taux=0")
                .expect(200);

            expect(response.body).toEqual({
                ht: 100,
                taux: 0,
                ttc: 100,
            });
        });

        test("devrait retourner une erreur 400 pour des paramètres manquants", async () => {
            const response = await request(app).get("/tva?ht=100").expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body).toHaveProperty(
                "code",
                "TVA_CALCULATION_ERROR"
            );
        });

        test("devrait retourner une erreur 400 pour HT négatif", async () => {
            const response = await request(app)
                .get("/tva?ht=-100&taux=20")
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("négatif");
        });

        test("devrait retourner une erreur 400 pour taux invalide", async () => {
            const response = await request(app)
                .get("/tva?ht=100&taux=101")
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("entre 0 et 100");
        });

        test("devrait gérer les nombres décimaux", async () => {
            const response = await request(app)
                .get("/tva?ht=99.99&taux=19.6")
                .expect(200);

            expect(response.body.ht).toBe(99.99);
            expect(response.body.taux).toBe(19.6);
            expect(response.body.ttc).toBe(119.59);
        });
    });

    describe("GET /remise", () => {
        test("devrait calculer la remise avec succès", async () => {
            const response = await request(app)
                .get("/remise?prix=100&pourcentage=10")
                .expect(200);

            expect(response.body).toEqual({
                prixInitial: 100,
                pourcentage: 10,
                prixFinal: 90,
            });
        });

        test("devrait calculer la remise avec pourcentage 0%", async () => {
            const response = await request(app)
                .get("/remise?prix=100&pourcentage=0")
                .expect(200);

            expect(response.body).toEqual({
                prixInitial: 100,
                pourcentage: 0,
                prixFinal: 100,
            });
        });

        test("devrait calculer la remise avec pourcentage 100%", async () => {
            const response = await request(app)
                .get("/remise?prix=100&pourcentage=100")
                .expect(200);

            expect(response.body).toEqual({
                prixInitial: 100,
                pourcentage: 100,
                prixFinal: 0,
            });
        });

        test("devrait retourner une erreur 400 pour des paramètres manquants", async () => {
            const response = await request(app)
                .get("/remise?prix=100")
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body).toHaveProperty(
                "code",
                "DISCOUNT_CALCULATION_ERROR"
            );
        });

        test("devrait retourner une erreur 400 pour prix négatif", async () => {
            const response = await request(app)
                .get("/remise?prix=-100&pourcentage=10")
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("négatif");
        });

        test("devrait retourner une erreur 400 pour pourcentage invalide", async () => {
            const response = await request(app)
                .get("/remise?prix=100&pourcentage=101")
                .expect(400);

            expect(response.body).toHaveProperty("error");
            expect(response.body.error).toContain("entre 0 et 100");
        });

        test("devrait gérer les nombres décimaux", async () => {
            const response = await request(app)
                .get("/remise?prix=99.99&pourcentage=15.5")
                .expect(200);

            expect(response.body.prixInitial).toBe(99.99);
            expect(response.body.pourcentage).toBe(15.5);
            expect(response.body.prixFinal).toBe(84.49);
        });
    });

    describe("GET /health", () => {
        test("devrait retourner le statut de santé du service", async () => {
            const response = await request(app).get("/health").expect(200);

            expect(response.body).toHaveProperty("status", "healthy");
            expect(response.body).toHaveProperty("timestamp");
            expect(response.body).toHaveProperty(
                "service",
                "financial-conversion-api"
            );
        });
    });

    describe("GET /rates", () => {
        test("devrait retourner les taux de change disponibles", async () => {
            const response = await request(app).get("/rates").expect(200);

            expect(response.body).toHaveProperty("rates");
            expect(response.body).toHaveProperty("supportedConversions");
            expect(response.body.rates).toEqual({
                "EUR-USD": 1.1,
                "USD-GBP": 0.8,
                "USD-EUR": 1 / 1.1,
                "GBP-USD": 1 / 0.8,
            });
        });
    });

    describe("Gestion des erreurs globales", () => {
        test("devrait retourner 404 pour un endpoint inexistant", async () => {
            const response = await request(app).get("/nonexistent").expect(404);

            expect(response.body).toHaveProperty("error", "Endpoint not found");
            expect(response.body).toHaveProperty("code", "NOT_FOUND");
            expect(response.body).toHaveProperty("availableEndpoints");
        });

        test("devrait lister les endpoints disponibles en cas d'erreur 404", async () => {
            const response = await request(app)
                .get("/invalid-endpoint")
                .expect(404);

            expect(response.body.availableEndpoints).toContain("/convert");
            expect(response.body.availableEndpoints).toContain("/tva");
            expect(response.body.availableEndpoints).toContain("/remise");
            expect(response.body.availableEndpoints).toContain("/health");
            expect(response.body.availableEndpoints).toContain("/rates");
        });
    });

    describe("Validation des types de réponse", () => {
        test("toutes les réponses doivent être en JSON", async () => {
            const endpoints = [
                "/convert?from=EUR&to=USD&amount=100",
                "/tva?ht=100&taux=20",
                "/remise?prix=100&pourcentage=10",
                "/health",
                "/rates",
            ];

            for (const endpoint of endpoints) {
                const response = await request(app).get(endpoint);
                expect(response.headers["content-type"]).toMatch(/json/);
            }
        });
    });
});
