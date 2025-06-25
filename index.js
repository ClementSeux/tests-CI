const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const ApiRoutes = require("./src/routes/apiRoutes");

const app = express();
app.use(express.json());

// Connect to SQLite DB (optionnel pour ce microservice)
const db = new sqlite3.Database("./db_crud.db", (err) => {
    if (err) return console.error(err.message);
    console.log("Connected to SQLite database.");
});

// Configuration des routes API
const apiRoutes = new ApiRoutes();
app.use("/", apiRoutes.getRouter());

// Middleware de gestion d'erreurs globales
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
    });
});

// Middleware pour gérer les endpoints non trouvés (doit être en dernier)
app.use((req, res) => {
    res.status(404).json({
        error: "Endpoint not found",
        code: "NOT_FOUND",
        availableEndpoints: [
            "/convert",
            "/tva",
            "/remise",
            "/health",
            "/rates",
        ],
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Financial Conversion Microservice running on port ${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  GET /convert?from=EUR&to=USD&amount=100`);
    console.log(`  GET /tva?ht=100&taux=20`);
    console.log(`  GET /remise?prix=100&pourcentage=10`);
    console.log(`  GET /health`);
    console.log(`  GET /rates`);
});

// Close the database connection on exit
process.on("SIGINT", () => {
    console.log("\nGracefully shutting down...");
    server.close(() => {
        db.close((err) => {
            if (err) return console.error(err.message);
            console.log("Closed the database connection.");
            process.exit(0);
        });
    });
});

// Export the app and server for testing purposes
module.exports = { app, server, db };
