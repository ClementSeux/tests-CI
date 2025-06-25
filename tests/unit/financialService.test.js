const FinancialService = require('../../src/services/financialService');

describe('FinancialService - Tests Unitaires', () => {
    let financialService;

    beforeEach(() => {
        financialService = new FinancialService();
    });

    describe('calculateTTC', () => {
        test('devrait calculer le TTC correctement avec TVA 20%', () => {
            const result = financialService.calculateTTC(100, 20);
            
            expect(result).toEqual({
                ht: 100,
                taux: 20,
                ttc: 120
            });
        });

        test('devrait calculer le TTC avec TVA 0%', () => {
            const result = financialService.calculateTTC(100, 0);
            
            expect(result).toEqual({
                ht: 100,
                taux: 0,
                ttc: 100
            });
        });

        test('devrait gérer les nombres décimaux', () => {
            const result = financialService.calculateTTC(99.99, 19.6);
            
            expect(result.ht).toBe(99.99);
            expect(result.taux).toBe(19.6);
            expect(result.ttc).toBe(119.59);
        });

        test('devrait gérer les chaînes de caractères numériques', () => {
            const result = financialService.calculateTTC('100', '20');
            
            expect(result.ht).toBe(100);
            expect(result.taux).toBe(20);
            expect(result.ttc).toBe(120);
        });

        test('devrait arrondir à 2 décimales', () => {
            const result = financialService.calculateTTC(33.33, 20);
            
            expect(result.ttc).toBe(40);
        });

        test('devrait accepter HT = 0', () => {
            const result = financialService.calculateTTC(0, 20);
            
            expect(result.ttc).toBe(0);
        });
    });

    describe('calculateTTC - Validation des erreurs', () => {
        test('devrait lever une erreur pour des paramètres manquants', () => {
            expect(() => financialService.calculateTTC()).toThrow('Paramètres manquants: ht et taux sont requis');
            expect(() => financialService.calculateTTC(100)).toThrow('Paramètres manquants: ht et taux sont requis');
            expect(() => financialService.calculateTTC(null, 20)).toThrow('Paramètres manquants: ht et taux sont requis');
        });

        test('devrait lever une erreur pour des valeurs invalides', () => {
            expect(() => financialService.calculateTTC('invalid', 20)).toThrow('HT et taux doivent être des nombres valides');
            expect(() => financialService.calculateTTC(100, 'invalid')).toThrow('HT et taux doivent être des nombres valides');
            expect(() => financialService.calculateTTC(NaN, 20)).toThrow('HT et taux doivent être des nombres valides');
        });

        test('devrait lever une erreur pour HT négatif', () => {
            expect(() => financialService.calculateTTC(-10, 20)).toThrow('Le montant HT ne peut pas être négatif');
        });

        test('devrait lever une erreur pour taux de TVA invalide', () => {
            expect(() => financialService.calculateTTC(100, -5)).toThrow('Le taux de TVA doit être entre 0 et 100');
            expect(() => financialService.calculateTTC(100, 101)).toThrow('Le taux de TVA doit être entre 0 et 100');
        });
    });

    describe('calculateDiscount', () => {
        test('devrait calculer une remise de 10% correctement', () => {
            const result = financialService.calculateDiscount(100, 10);
            
            expect(result).toEqual({
                prixInitial: 100,
                pourcentage: 10,
                prixFinal: 90
            });
        });

        test('devrait calculer une remise de 0%', () => {
            const result = financialService.calculateDiscount(100, 0);
            
            expect(result).toEqual({
                prixInitial: 100,
                pourcentage: 0,
                prixFinal: 100
            });
        });

        test('devrait calculer une remise de 100%', () => {
            const result = financialService.calculateDiscount(100, 100);
            
            expect(result).toEqual({
                prixInitial: 100,
                pourcentage: 100,
                prixFinal: 0
            });
        });

        test('devrait gérer les nombres décimaux', () => {
            const result = financialService.calculateDiscount(99.99, 15.5);
            
            expect(result.prixInitial).toBe(99.99);
            expect(result.pourcentage).toBe(15.5);
            expect(result.prixFinal).toBe(84.49);
        });

        test('devrait gérer les chaînes de caractères numériques', () => {
            const result = financialService.calculateDiscount('100', '25');
            
            expect(result.prixInitial).toBe(100);
            expect(result.pourcentage).toBe(25);
            expect(result.prixFinal).toBe(75);
        });

        test('devrait arrondir à 2 décimales', () => {
            const result = financialService.calculateDiscount(33.33, 33.33);
            
            expect(result.prixFinal).toBe(22.22);
        });

        test('devrait accepter prix = 0', () => {
            const result = financialService.calculateDiscount(0, 10);
            
            expect(result.prixFinal).toBe(0);
        });
    });

    describe('calculateDiscount - Validation des erreurs', () => {
        test('devrait lever une erreur pour des paramètres manquants', () => {
            expect(() => financialService.calculateDiscount()).toThrow('Paramètres manquants: prix et pourcentage sont requis');
            expect(() => financialService.calculateDiscount(100)).toThrow('Paramètres manquants: prix et pourcentage sont requis');
            expect(() => financialService.calculateDiscount(null, 10)).toThrow('Paramètres manquants: prix et pourcentage sont requis');
        });

        test('devrait lever une erreur pour des valeurs invalides', () => {
            expect(() => financialService.calculateDiscount('invalid', 10)).toThrow('Prix et pourcentage doivent être des nombres valides');
            expect(() => financialService.calculateDiscount(100, 'invalid')).toThrow('Prix et pourcentage doivent être des nombres valides');
            expect(() => financialService.calculateDiscount(NaN, 10)).toThrow('Prix et pourcentage doivent être des nombres valides');
        });

        test('devrait lever une erreur pour prix négatif', () => {
            expect(() => financialService.calculateDiscount(-10, 10)).toThrow('Le prix ne peut pas être négatif');
        });

        test('devrait lever une erreur pour pourcentage invalide', () => {
            expect(() => financialService.calculateDiscount(100, -5)).toThrow('Le pourcentage de remise doit être entre 0 et 100');
            expect(() => financialService.calculateDiscount(100, 101)).toThrow('Le pourcentage de remise doit être entre 0 et 100');
        });
    });

    describe('calculateDiscountAmount', () => {
        test('devrait calculer le montant de la remise', () => {
            const amount = financialService.calculateDiscountAmount(100, 20);
            expect(amount).toBe(20);
        });

        test('devrait calculer le montant de la remise avec décimales', () => {
            const amount = financialService.calculateDiscountAmount(99.99, 10);
            expect(amount).toBe(10);
        });

        test('devrait retourner 0 pour une remise de 0%', () => {
            const amount = financialService.calculateDiscountAmount(100, 0);
            expect(amount).toBe(0);
        });

        test('devrait retourner le prix total pour une remise de 100%', () => {
            const amount = financialService.calculateDiscountAmount(100, 100);
            expect(amount).toBe(100);
        });
    });
});
