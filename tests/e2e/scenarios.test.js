const request = require("supertest");
const { app } = require("../../index");

describe("Tests E2E - Scénarios Complets", () => {
    describe("Scénario 1: Conversion suivie de calcul TVA", () => {
        test("devrait convertir EUR vers USD puis calculer la TVA", async () => {
            // Étape 1: Conversion EUR -> USD
            const conversionResponse = await request(app)
                .get("/convert?from=EUR&to=USD&amount=100")
                .expect(200);

            expect(conversionResponse.body).toEqual({
                from: "EUR",
                to: "USD",
                originalAmount: 100,
                convertedAmount: 110,
            });

            // Étape 2: Calcul TVA sur le montant converti
            const tvaResponse = await request(app)
                .get(
                    `/tva?ht=${conversionResponse.body.convertedAmount}&taux=20`
                )
                .expect(200);

            expect(tvaResponse.body).toEqual({
                ht: 110,
                taux: 20,
                ttc: 132,
            });

            // Vérification du scénario complet
            expect(tvaResponse.body.ttc).toBe(132); // 100 EUR -> 110 USD -> 132 USD TTC
        });

        test("devrait gérer un scénario complexe avec conversion et TVA française", async () => {
            // Conversion d'un montant plus complexe
            const conversionResponse = await request(app)
                .get("/convert?from=EUR&to=USD&amount=250.75")
                .expect(200);

            expect(conversionResponse.body.convertedAmount).toBe(275.83);

            // Application de la TVA française (20%)
            const tvaResponse = await request(app)
                .get(
                    `/tva?ht=${conversionResponse.body.convertedAmount}&taux=20`
                )
                .expect(200);

            expect(tvaResponse.body.ttc).toBe(331);
        });
    });

    describe("Scénario 2: Conversion suivie de remise", () => {
        test("devrait convertir USD vers GBP puis appliquer une remise", async () => {
            // Étape 1: Conversion USD -> GBP
            const conversionResponse = await request(app)
                .get("/convert?from=USD&to=GBP&amount=1000")
                .expect(200);

            expect(conversionResponse.body).toEqual({
                from: "USD",
                to: "GBP",
                originalAmount: 1000,
                convertedAmount: 800,
            });

            // Étape 2: Application d'une remise de 15%
            const remiseResponse = await request(app)
                .get(
                    `/remise?prix=${conversionResponse.body.convertedAmount}&pourcentage=15`
                )
                .expect(200);

            expect(remiseResponse.body).toEqual({
                prixInitial: 800,
                pourcentage: 15,
                prixFinal: 680,
            });

            // Vérification du scénario complet
            expect(remiseResponse.body.prixFinal).toBe(680); // 1000 USD -> 800 GBP -> 680 GBP après remise
        });
    });

    describe("Scénario 3: Calcul de prix final avec TVA et remise", () => {
        test("devrait calculer un prix final avec remise puis TVA", async () => {
            const prixInitial = 500;
            const remisePourcentage = 10;
            const tauxTVA = 20;

            // Étape 1: Application de la remise
            const remiseResponse = await request(app)
                .get(
                    `/remise?prix=${prixInitial}&pourcentage=${remisePourcentage}`
                )
                .expect(200);

            expect(remiseResponse.body.prixFinal).toBe(450);

            // Étape 2: Application de la TVA sur le prix après remise
            const tvaResponse = await request(app)
                .get(`/tva?ht=${remiseResponse.body.prixFinal}&taux=${tauxTVA}`)
                .expect(200);

            expect(tvaResponse.body.ttc).toBe(540);

            // Vérification du calcul: 500 - 10% = 450, puis +20% TVA = 540
        });

        test("devrait calculer un prix final avec TVA puis remise", async () => {
            const prixHT = 500;
            const tauxTVA = 20;
            const remisePourcentage = 10;

            // Étape 1: Application de la TVA
            const tvaResponse = await request(app)
                .get(`/tva?ht=${prixHT}&taux=${tauxTVA}`)
                .expect(200);

            expect(tvaResponse.body.ttc).toBe(600);

            // Étape 2: Application de la remise sur le prix TTC
            const remiseResponse = await request(app)
                .get(
                    `/remise?prix=${tvaResponse.body.ttc}&pourcentage=${remisePourcentage}`
                )
                .expect(200);

            expect(remiseResponse.body.prixFinal).toBe(540);

            // Vérification du calcul: 500 +20% TVA = 600, puis -10% = 540
        });
    });

    describe("Scénario 4: Workflow complet multi-devises", () => {
        test("devrait gérer un workflow complet avec plusieurs conversions", async () => {
            // Scénario: Un prix en EUR, converti en USD, puis en GBP, avec TVA et remise

            // Prix initial en EUR
            const prixEUR = 1000;

            // Étape 1: EUR -> USD
            const eurToUsdResponse = await request(app)
                .get(`/convert?from=EUR&to=USD&amount=${prixEUR}`)
                .expect(200);

            const prixUSD = eurToUsdResponse.body.convertedAmount;
            expect(prixUSD).toBe(1100);

            // Étape 2: USD -> GBP (via conversion inverse)
            // Note: Notre API ne supporte que USD->GBP directement
            const usdToGbpResponse = await request(app)
                .get(`/convert?from=USD&to=GBP&amount=${prixUSD}`)
                .expect(200);

            const prixGBP = usdToGbpResponse.body.convertedAmount;
            expect(prixGBP).toBe(880);

            // Étape 3: Application d'une remise commerciale de 5%
            const remiseResponse = await request(app)
                .get(`/remise?prix=${prixGBP}&pourcentage=5`)
                .expect(200);

            const prixApresRemise = remiseResponse.body.prixFinal;
            expect(prixApresRemise).toBe(836);

            // Étape 4: Application de la TVA britannique (20%)
            const tvaResponse = await request(app)
                .get(`/tva?ht=${prixApresRemise}&taux=20`)
                .expect(200);

            const prixFinalTTC = tvaResponse.body.ttc;
            expect(prixFinalTTC).toBe(1003.2);

            // Vérification du workflow complet:
            // 1000 EUR -> 1100 USD -> 880 GBP -> 836 GBP (après remise) -> 1003.20 GBP TTC
            console.log(
                `Workflow complet: ${prixEUR} EUR -> ${prixUSD} USD -> ${prixGBP} GBP -> ${prixApresRemise} GBP (après remise) -> ${prixFinalTTC} GBP TTC`
            );
        });
    });

    describe("Scénario 5: Gestion d'erreurs en cascade", () => {
        test("devrait gérer les erreurs lors d'un workflow complexe", async () => {
            // Étape 1: Conversion valide
            const conversionResponse = await request(app)
                .get("/convert?from=EUR&to=USD&amount=100")
                .expect(200);

            // Étape 2: Tentative de calcul TVA avec un taux invalide
            await request(app)
                .get(
                    `/tva?ht=${conversionResponse.body.convertedAmount}&taux=101`
                )
                .expect(400);

            // Étape 3: Correction et calcul TVA valide
            const tvaResponse = await request(app)
                .get(
                    `/tva?ht=${conversionResponse.body.convertedAmount}&taux=20`
                )
                .expect(200);

            expect(tvaResponse.body.ttc).toBe(132);
        });

        test("devrait maintenir la cohérence des données malgré les erreurs", async () => {
            // Test de résilience: même après des erreurs, les calculs suivants doivent être corrects

            // Génération d'erreurs volontaires
            await request(app)
                .get("/convert?from=INVALID&to=USD&amount=100")
                .expect(400);
            await request(app).get("/tva?ht=-100&taux=20").expect(400);
            await request(app)
                .get("/remise?prix=100&pourcentage=101")
                .expect(400);

            // Vérification que l'API fonctionne toujours correctement après les erreurs
            const conversionResponse = await request(app)
                .get("/convert?from=EUR&to=USD&amount=100")
                .expect(200);

            expect(conversionResponse.body.convertedAmount).toBe(110);

            const tvaResponse = await request(app)
                .get(
                    `/tva?ht=${conversionResponse.body.convertedAmount}&taux=20`
                )
                .expect(200);

            expect(tvaResponse.body.ttc).toBe(132);
        });
    });

    describe("Scénario 6: Tests de performance E2E", () => {
        test("devrait traiter plusieurs workflows simultanément", async () => {
            const startTime = Date.now();

            // Lancement de 10 workflows en parallèle
            const workflows = Array.from({ length: 10 }, async (_, index) => {
                const amount = 100 + index;

                // Conversion
                const conversionResponse = await request(app)
                    .get(`/convert?from=EUR&to=USD&amount=${amount}`)
                    .expect(200);

                // TVA
                const tvaResponse = await request(app)
                    .get(
                        `/tva?ht=${conversionResponse.body.convertedAmount}&taux=20`
                    )
                    .expect(200);

                // Remise
                const remiseResponse = await request(app)
                    .get(`/remise?prix=${tvaResponse.body.ttc}&pourcentage=5`)
                    .expect(200);

                return {
                    index,
                    originalAmount: amount,
                    finalAmount: remiseResponse.body.prixFinal,
                };
            });

            const results = await Promise.all(workflows);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Vérifications
            expect(results).toHaveLength(10);
            expect(duration).toBeLessThan(5000); // Moins de 5 secondes pour 10 workflows

            // Vérification que tous les calculs sont corrects
            results.forEach((result, index) => {
                const expectedOriginal = 100 + index;
                const expectedFinal = parseFloat(
                    (expectedOriginal * 1.1 * 1.2 * 0.95).toFixed(2)
                );

                expect(result.originalAmount).toBe(expectedOriginal);
                expect(result.finalAmount).toBe(expectedFinal);
            });
        });
    });

    describe("Scénario 7: Validation de la santé du service", () => {
        test("devrait vérifier que tous les endpoints sont opérationnels", async () => {
            // Test de santé global
            const healthResponse = await request(app)
                .get("/health")
                .expect(200);

            expect(healthResponse.body.status).toBe("healthy");

            // Test de tous les endpoints principaux
            const endpoints = [
                {
                    path: "/convert?from=EUR&to=USD&amount=100",
                    expectedStatus: 200,
                },
                { path: "/tva?ht=100&taux=20", expectedStatus: 200 },
                {
                    path: "/remise?prix=100&pourcentage=10",
                    expectedStatus: 200,
                },
                { path: "/rates", expectedStatus: 200 },
            ];

            for (const endpoint of endpoints) {
                await request(app)
                    .get(endpoint.path)
                    .expect(endpoint.expectedStatus);
            }
        });
    });
});
