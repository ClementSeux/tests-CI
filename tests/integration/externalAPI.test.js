const ConversionService = require("../../src/services/conversionService");

// Mock d'une API externe de taux de change
class MockExchangeRateAPI {
    constructor() {
        this.isDown = false;
        this.latency = 0;
        this.rates = {
            "EUR-USD": 1.1,
            "USD-GBP": 0.8,
            "USD-EUR": 1 / 1.1,
            "GBP-USD": 1 / 0.8,
        };
    }

    setDown(isDown) {
        this.isDown = isDown;
    }

    setLatency(ms) {
        this.latency = ms;
    }

    updateRate(from, to, rate) {
        this.rates[`${from}-${to}`] = rate;
    }

    async getRate(from, to) {
        // Simulation de latence réseau
        if (this.latency > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.latency));
        }

        // Simulation d'une API en panne
        if (this.isDown) {
            throw new Error("API temporarily unavailable");
        }

        const rateKey = `${from}-${to}`;
        const rate = this.rates[rateKey];

        if (!rate) {
            throw new Error(`Exchange rate not found for ${from}-${to}`);
        }

        return {
            from,
            to,
            rate,
            timestamp: new Date().toISOString(),
            source: "MockExchangeRateAPI",
        };
    }
}

describe("Tests d'Intégration - API de Taux de Change", () => {
    let conversionService;
    let mockAPI;

    beforeEach(() => {
        conversionService = new ConversionService();
        mockAPI = new MockExchangeRateAPI();
    });

    describe("Intégration avec API externe mockée", () => {
        test("devrait récupérer un taux de change depuis l'API mockée", async () => {
            const result = await mockAPI.getRate("EUR", "USD");

            expect(result).toEqual({
                from: "EUR",
                to: "USD",
                rate: 1.1,
                timestamp: expect.any(String),
                source: "MockExchangeRateAPI",
            });
        });

        test("devrait gérer la latence réseau", async () => {
            mockAPI.setLatency(200);

            const start = Date.now();
            await mockAPI.getRate("EUR", "USD");
            const duration = Date.now() - start;

            expect(duration).toBeGreaterThanOrEqual(200);
        });

        test("devrait gérer une API en panne", async () => {
            mockAPI.setDown(true);

            await expect(mockAPI.getRate("EUR", "USD")).rejects.toThrow(
                "API temporarily unavailable"
            );
        });

        test("devrait gérer une devise non supportée par l'API", async () => {
            await expect(mockAPI.getRate("EUR", "JPY")).rejects.toThrow(
                "Exchange rate not found for EUR-JPY"
            );
        });
    });

    describe("Service de conversion avec fallback", () => {
        // Extension du ConversionService pour supporter l'API externe
        class ExtendedConversionService extends ConversionService {
            constructor(externalAPI) {
                super();
                this.externalAPI = externalAPI;
            }

            async convertWithExternalAPI(from, to, amount) {
                try {
                    // Tentative d'utilisation de l'API externe
                    const apiResult = await this.externalAPI.getRate(from, to);
                    const convertedAmount = parseFloat(
                        (amount * apiResult.rate).toFixed(2)
                    );

                    return {
                        from,
                        to,
                        originalAmount: parseFloat(amount),
                        convertedAmount,
                        source: "external-api",
                        timestamp: apiResult.timestamp,
                    };
                } catch (error) {
                    // Fallback vers les taux internes
                    console.log(
                        "External API failed, using internal rates:",
                        error.message
                    );
                    const result = this.convert(from, to, amount);
                    return {
                        ...result,
                        source: "internal-rates",
                        apiError: error.message,
                    };
                }
            }
        }

        test("devrait utiliser l'API externe quand elle est disponible", async () => {
            const extendedService = new ExtendedConversionService(mockAPI);

            const result = await extendedService.convertWithExternalAPI(
                "EUR",
                "USD",
                100
            );

            expect(result.source).toBe("external-api");
            expect(result.convertedAmount).toBe(110);
            expect(result).toHaveProperty("timestamp");
        });

        test("devrait fallback vers les taux internes si l'API échoue", async () => {
            mockAPI.setDown(true);
            const extendedService = new ExtendedConversionService(mockAPI);

            const result = await extendedService.convertWithExternalAPI(
                "EUR",
                "USD",
                100
            );

            expect(result.source).toBe("internal-rates");
            expect(result.convertedAmount).toBe(110);
            expect(result).toHaveProperty("apiError");
        });

        test("devrait gérer le timeout de l'API externe", async () => {
            mockAPI.setLatency(5000); // 5 secondes de latence
            const extendedService = new ExtendedConversionService(mockAPI);

            // Test avec timeout personnalisé
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("API timeout")), 1000);
            });

            const conversionPromise = extendedService.convertWithExternalAPI(
                "EUR",
                "USD",
                100
            );

            await expect(
                Promise.race([conversionPromise, timeoutPromise])
            ).rejects.toThrow("API timeout");
        }, 10000);
    });
    describe("Tests de charge avec API mockée", () => {
        test("devrait gérer plusieurs appels simultanés", async () => {
            const extendedService = ConversionService;
            mockAPI.setLatency(100);

            const promises = Array.from({ length: 10 }, (_, i) =>
                mockAPI.getRate("EUR", "USD")
            );
            const results = await Promise.all(promises);

            expect(results).toHaveLength(10);
            results.forEach((result, index) => {
                expect(result.rate).toBe(1.1);
            });
        });

        test("devrait gérer les échecs partiels d'API", async () => {
            // Simuler une API qui tombe en panne après 5 appels
            let callCount = 0;
            const originalGetRate = mockAPI.getRate.bind(mockAPI);
            mockAPI.getRate = async function (from, to) {
                callCount++;
                if (callCount > 5) {
                    throw new Error("API rate limit exceeded");
                }
                return originalGetRate(from, to);
            };
            const promises = Array.from({ length: 10 }, () =>
                mockAPI
                    .getRate("EUR", "USD")
                    .catch((e) => ({ error: e.message }))
            );

            const results = await Promise.all(promises);

            // Vérifier qu'on a des succès et des échecs
            const successes = results.filter((r) => !r.error);
            const failures = results.filter((r) => r.error);

            expect(successes).toHaveLength(5);
            expect(failures).toHaveLength(5);
        });
    });

    describe("Tests de mise à jour des taux", () => {
        test("devrait utiliser les nouveaux taux quand ils sont mis à jour", async () => {
            // Mise à jour du taux EUR-USD
            mockAPI.updateRate("EUR", "USD", 1.2);

            const result = await mockAPI.getRate("EUR", "USD");
            expect(result.rate).toBe(1.2);
        });
        test("devrait maintenir la cohérence des conversions avec les nouveaux taux", async () => {
            // Taux initial
            let result1 = await mockAPI.getRate("EUR", "USD");
            expect(result1.rate).toBe(1.1);

            // Mise à jour du taux
            mockAPI.updateRate("EUR", "USD", 1.15);

            // Nouveau résultat avec le taux mis à jour
            let result2 = await mockAPI.getRate("EUR", "USD");
            expect(result2.rate).toBe(1.15);
        });
    });
});
