const ConversionService = require('../../src/services/conversionService');

describe('ConversionService - Tests Unitaires', () => {
    let conversionService;

    beforeEach(() => {
        conversionService = new ConversionService();
    });

    describe('convert', () => {
        test('devrait convertir EUR vers USD correctement', () => {
            const result = conversionService.convert('EUR', 'USD', 100);
            
            expect(result).toEqual({
                from: 'EUR',
                to: 'USD',
                originalAmount: 100,
                convertedAmount: 110
            });
        });

        test('devrait convertir USD vers GBP correctement', () => {
            const result = conversionService.convert('USD', 'GBP', 100);
            
            expect(result).toEqual({
                from: 'USD',
                to: 'GBP',
                originalAmount: 100,
                convertedAmount: 80
            });
        });

        test('devrait convertir USD vers EUR correctement (conversion inverse)', () => {
            const result = conversionService.convert('USD', 'EUR', 110);
            
            expect(result.from).toBe('USD');
            expect(result.to).toBe('EUR');
            expect(result.originalAmount).toBe(110);
            expect(result.convertedAmount).toBeCloseTo(100, 2);
        });

        test('devrait retourner le même montant pour une conversion identique', () => {
            const result = conversionService.convert('EUR', 'EUR', 100);
            
            expect(result).toEqual({
                from: 'EUR',
                to: 'EUR',
                originalAmount: 100,
                convertedAmount: 100
            });
        });

        test('devrait gérer les nombres décimaux', () => {
            const result = conversionService.convert('EUR', 'USD', 99.99);
            
            expect(result.originalAmount).toBe(99.99);
            expect(result.convertedAmount).toBe(109.99);
        });

        test('devrait gérer les chaînes de caractères numériques', () => {
            const result = conversionService.convert('EUR', 'USD', '100');
            
            expect(result.originalAmount).toBe(100);
            expect(result.convertedAmount).toBe(110);
        });

        test('devrait arrondir à 2 décimales', () => {
            const result = conversionService.convert('EUR', 'USD', 33.33);
            
            expect(result.convertedAmount).toBe(36.66);
        });
    });

    describe('Validation des erreurs', () => {
        test('devrait lever une erreur pour des paramètres manquants', () => {
            expect(() => conversionService.convert()).toThrow('Paramètres manquants: from, to et amount sont requis');
            expect(() => conversionService.convert('EUR')).toThrow('Paramètres manquants: from, to et amount sont requis');
            expect(() => conversionService.convert('EUR', 'USD')).toThrow('Paramètres manquants: from, to et amount sont requis');
        });

        test('devrait lever une erreur pour un montant invalide', () => {
            expect(() => conversionService.convert('EUR', 'USD', 'invalid')).toThrow('Le montant doit être un nombre positif');
            expect(() => conversionService.convert('EUR', 'USD', NaN)).toThrow('Le montant doit être un nombre positif');
            expect(() => conversionService.convert('EUR', 'USD', -10)).toThrow('Le montant doit être un nombre positif');
        });

        test('devrait lever une erreur pour une conversion non supportée', () => {
            expect(() => conversionService.convert('EUR', 'JPY', 100)).toThrow('Conversion non supportée: EUR vers JPY');
            expect(() => conversionService.convert('ABC', 'XYZ', 100)).toThrow('Conversion non supportée: ABC vers XYZ');
        });

        test('devrait accepter le montant 0', () => {
            const result = conversionService.convert('EUR', 'USD', 0);
            expect(result.convertedAmount).toBe(0);
        });
    });

    describe('getExchangeRates', () => {
        test('devrait retourner tous les taux de change', () => {
            const rates = conversionService.getExchangeRates();
            
            expect(rates).toEqual({
                'EUR-USD': 1.1,
                'USD-GBP': 0.8,
                'USD-EUR': 1 / 1.1,
                'GBP-USD': 1 / 0.8
            });
        });

        test('devrait retourner une copie des taux (immutabilité)', () => {
            const rates = conversionService.getExchangeRates();
            rates['TEST'] = 999;
            
            const rates2 = conversionService.getExchangeRates();
            expect(rates2['TEST']).toBeUndefined();
        });
    });

    describe('fetchExchangeRateFromAPI', () => {
        test('devrait simuler un appel API réussi', async () => {
            const rate = await conversionService.fetchExchangeRateFromAPI('EUR', 'USD');
            expect(rate).toBe(1.1);
        });

        test('devrait simuler un appel API échoué', async () => {
            await expect(conversionService.fetchExchangeRateFromAPI('EUR', 'JPY'))
                .rejects.toThrow('Taux de change non trouvé pour EUR-JPY');
        });

        test('devrait avoir une latence simulée', async () => {
            const start = Date.now();
            await conversionService.fetchExchangeRateFromAPI('EUR', 'USD');
            const duration = Date.now() - start;
            
            expect(duration).toBeGreaterThanOrEqual(100);
        });
    });
});
