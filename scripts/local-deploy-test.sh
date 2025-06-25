#!/bin/bash

# Script de test de déploiement local
# Usage: ./local-deploy-test.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_DIR="/tmp/financial-microservice-test"
PORT=3002

echo "🧪 Test de déploiement local"
echo "=========================="

# Fonction de logging
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# Nettoyage des tests précédents
cleanup() {
    log "🧹 Nettoyage..."
    pkill -f "node.*index.js.*$PORT" 2>/dev/null || true
    rm -rf "$TEST_DIR" 2>/dev/null || true
}

# Configuration du nettoyage automatique
trap cleanup EXIT

log "📁 Préparation du répertoire de test..."
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"

log "📋 Copie des fichiers du projet..."
cp -r "$PROJECT_ROOT"/* "$TEST_DIR/" 2>/dev/null || true
cd "$TEST_DIR"

# Exclusion des fichiers non nécessaires
rm -rf node_modules coverage .git 2>/dev/null || true

log "📚 Installation des dépendances..."
npm ci --production --silent

log "🚀 Démarrage de l'application (port $PORT)..."
PORT=$PORT NODE_ENV=test node index.js &
APP_PID=$!

log "⏳ Attente du démarrage..."
sleep 5

# Tests de santé
log "🩺 Tests de santé..."

# Test 1: Endpoint de santé
if curl -f "http://localhost:$PORT/health" >/dev/null 2>&1; then
    log "✅ Endpoint /health opérationnel"
else
    log "❌ Endpoint /health défaillant"
    exit 1
fi

# Test 2: Conversion EUR/USD
response=$(curl -s "http://localhost:$PORT/convert?from=EUR&to=USD&amount=100")
if echo "$response" | grep -q '"convertedAmount":110'; then
    log "✅ Conversion EUR/USD fonctionnelle"
else
    log "❌ Conversion EUR/USD défaillante"
    echo "Réponse reçue: $response"
    exit 1
fi

# Test 3: Calcul TTC
response=$(curl -s "http://localhost:$PORT/calculate/ttc?ht=100&tva=20")
if echo "$response" | grep -q '"ttc":120'; then
    log "✅ Calcul TTC fonctionnel"
else
    log "❌ Calcul TTC défaillant"
    echo "Réponse reçue: $response"
    exit 1
fi

# Test 4: Calcul de remise
response=$(curl -s "http://localhost:$PORT/calculate/discount?price=100&discount=10")
if echo "$response" | grep -q '"finalPrice":90'; then
    log "✅ Calcul de remise fonctionnel"
else
    log "❌ Calcul de remise défaillant"
    echo "Réponse reçue: $response"
    exit 1
fi

# Test 5: Gestion d'erreur
response=$(curl -s -w "%{http_code}" "http://localhost:$PORT/convert?from=INVALID&to=USD&amount=100")
if echo "$response" | grep -q "400"; then
    log "✅ Gestion d'erreur fonctionnelle"
else
    log "❌ Gestion d'erreur défaillante"
    echo "Réponse reçue: $response"
    exit 1
fi

# Test de performance basique
log "⚡ Test de performance..."
start_time=$(date +%s)
for i in {1..10}; do
    curl -s "http://localhost:$PORT/health" >/dev/null
done
end_time=$(date +%s)
duration=$((end_time - start_time))

if [ $duration -lt 5 ]; then
    log "✅ Performance acceptable ($duration secondes pour 10 requêtes)"
else
    log "⚠️ Performance lente ($duration secondes pour 10 requêtes)"
fi

# Vérification des ressources
memory_usage=$(ps -o pid,vsz,rss,comm -p $APP_PID | tail -1)
log "💾 Utilisation mémoire: $memory_usage"

log "🎉 Tous les tests de déploiement local réussis !"
log "🔗 Application accessible sur http://localhost:$PORT"

echo ""
echo "📊 Résumé des tests:"
echo "  ✅ Santé de l'application"
echo "  ✅ Conversion de devises"
echo "  ✅ Calculs financiers"
echo "  ✅ Gestion d'erreurs"
echo "  ✅ Performance de base"
echo ""
echo "💡 Prêt pour le déploiement sur VPS !"

# Garder l'application en marche pour inspection manuelle
read -p "Appuyez sur Entrée pour arrêter l'application de test..." -r
