// Service pour les calculs financiers
class FinancialService {
    /**
     * Calcule le montant TTC à partir du HT et du taux de TVA
     * @param {number} ht - Montant hors taxes
     * @param {number} taux - Taux de TVA en pourcentage
     * @returns {object} Résultat du calcul
     */
    calculateTTC(ht, taux) {
        // Validation des entrées
        if (ht === undefined || ht === null || taux === undefined || taux === null) {
            throw new Error('Paramètres manquants: ht et taux sont requis');
        }

        const numHT = parseFloat(ht);
        const numTaux = parseFloat(taux);

        if (isNaN(numHT) || isNaN(numTaux)) {
            throw new Error('HT et taux doivent être des nombres valides');
        }

        if (numHT < 0) {
            throw new Error('Le montant HT ne peut pas être négatif');
        }

        if (numTaux < 0 || numTaux > 100) {
            throw new Error('Le taux de TVA doit être entre 0 et 100');
        }

        const ttc = parseFloat((numHT * (1 + numTaux / 100)).toFixed(2));

        return {
            ht: numHT,
            taux: numTaux,
            ttc
        };
    }

    /**
     * Applique une remise sur un prix donné
     * @param {number} prix - Prix initial
     * @param {number} pourcentage - Pourcentage de remise
     * @returns {object} Résultat du calcul
     */
    calculateDiscount(prix, pourcentage) {
        // Validation des entrées
        if (prix === undefined || prix === null || pourcentage === undefined || pourcentage === null) {
            throw new Error('Paramètres manquants: prix et pourcentage sont requis');
        }

        const numPrix = parseFloat(prix);
        const numPourcentage = parseFloat(pourcentage);

        if (isNaN(numPrix) || isNaN(numPourcentage)) {
            throw new Error('Prix et pourcentage doivent être des nombres valides');
        }

        if (numPrix < 0) {
            throw new Error('Le prix ne peut pas être négatif');
        }

        if (numPourcentage < 0 || numPourcentage > 100) {
            throw new Error('Le pourcentage de remise doit être entre 0 et 100');
        }

        const prixFinal = parseFloat((numPrix * (1 - numPourcentage / 100)).toFixed(2));

        return {
            prixInitial: numPrix,
            pourcentage: numPourcentage,
            prixFinal
        };
    }

    /**
     * Calcule le montant d'une remise en valeur absolue
     * @param {number} prix - Prix initial
     * @param {number} pourcentage - Pourcentage de remise
     * @returns {number} Montant de la remise
     */
    calculateDiscountAmount(prix, pourcentage) {
        const result = this.calculateDiscount(prix, pourcentage);
        return parseFloat((result.prixInitial - result.prixFinal).toFixed(2));
    }
}

module.exports = FinancialService;
