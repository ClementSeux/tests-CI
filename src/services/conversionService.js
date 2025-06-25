// Service pour les conversions de devises
class ConversionService {
    constructor() {
        // Taux de conversion fixes selon le cahier des charges
        this.exchangeRates = {
            'EUR-USD': 1.1,  // 1 EUR = 1.1 USD
            'USD-GBP': 0.8,  // 1 USD = 0.8 GBP
            'USD-EUR': 1 / 1.1,  // Conversion inverse
            'GBP-USD': 1 / 0.8   // Conversion inverse
        };
    }

    /**
     * Convertit un montant d'une devise à une autre
     * @param {string} from - Devise source
     * @param {string} to - Devise cible
     * @param {number} amount - Montant à convertir
     * @returns {object} Résultat de la conversion
     */
    convert(from, to, amount) {
        // Validation des entrées
        if (!from || !to || amount === undefined || amount === null) {
            throw new Error('Paramètres manquants: from, to et amount sont requis');
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 0) {
            throw new Error('Le montant doit être un nombre positif');
        }

        if (from === to) {
            return {
                from,
                to,
                originalAmount: numAmount,
                convertedAmount: numAmount
            };
        }

        const rateKey = `${from}-${to}`;
        const rate = this.exchangeRates[rateKey];

        if (!rate) {
            throw new Error(`Conversion non supportée: ${from} vers ${to}`);
        }

        const convertedAmount = parseFloat((numAmount * rate).toFixed(2));

        return {
            from,
            to,
            originalAmount: numAmount,
            convertedAmount
        };
    }

    /**
     * Récupère les taux de change disponibles
     * @returns {object} Taux de change
     */
    getExchangeRates() {
        return { ...this.exchangeRates };
    }

    /**
     * Simule un appel à une API externe (pour les tests d'intégration)
     * @param {string} from - Devise source
     * @param {string} to - Devise cible
     * @returns {Promise<number>} Taux de change
     */
    async fetchExchangeRateFromAPI(from, to) {
        // Simulation d'un appel API avec délai
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const rateKey = `${from}-${to}`;
                const rate = this.exchangeRates[rateKey];
                
                if (rate) {
                    resolve(rate);
                } else {
                    reject(new Error(`Taux de change non trouvé pour ${from}-${to}`));
                }
            }, 100); // Simule une latence réseau
        });
    }
}

module.exports = ConversionService;
