const express = require("express");
const ConversionService = require("../services/conversionService");
const FinancialService = require("../services/financialService");

class ApiRoutes {
    constructor() {
        this.router = express.Router();
        this.conversionService = new ConversionService();
        this.financialService = new FinancialService();
        this.setupRoutes();
    }

    setupRoutes() {
        // Route de conversion de devises
        this.router.get("/convert", (req, res) => {
            try {
                const { from, to, amount } = req.query;
                const result = this.conversionService.convert(from, to, amount);
                res.json(result);
            } catch (error) {
                res.status(400).json({
                    error: error.message,
                    code: "CONVERSION_ERROR",
                });
            }
        });

        // Route de calcul TVA
        this.router.get("/tva", (req, res) => {
            try {
                const { ht, taux } = req.query;
                const result = this.financialService.calculateTTC(ht, taux);
                res.json(result);
            } catch (error) {
                res.status(400).json({
                    error: error.message,
                    code: "TVA_CALCULATION_ERROR",
                });
            }
        });

        // Route de calcul de remise
        this.router.get("/remise", (req, res) => {
            try {
                const { prix, pourcentage } = req.query;
                const result = this.financialService.calculateDiscount(
                    prix,
                    pourcentage
                );
                res.json(result);
            } catch (error) {
                res.status(400).json({
                    error: error.message,
                    code: "DISCOUNT_CALCULATION_ERROR",
                });
            }
        });

        // Route de santé pour monitoring
        this.router.get("/health", (req, res) => {
            res.json({
                status: "healthy",
                timestamp: new Date().toISOString(),
                service: "financial-conversion-api",
            });
        });

        // Route pour obtenir les taux de change disponibles
        this.router.get("/rates", (req, res) => {
            try {
                const rates = this.conversionService.getExchangeRates();
                res.json({
                    rates,
                    supportedConversions: Object.keys(rates),
                });
            } catch (error) {
                res.status(500).json({
                    error: error.message,
                    code: "RATES_ERROR",
                });
            }
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = ApiRoutes;
