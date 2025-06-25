#!/bin/bash

# Script de déploiement automatisé pour le microservice financier
# Usage: ./deploy.sh [staging|production]

set -e  # Arrêter en cas d'erreur

ENVIRONMENT=${1:-staging}
VERSION=${2:-$(date +%Y%m%d_%H%M%S)}
APP_DIR="/var/www/financial-microservice"
RELEASES_DIR="$APP_DIR/releases"
SHARED_DIR="$APP_DIR/shared"
CURRENT_LINK="$APP_DIR/current"
REPO_URL="https://github.com/votre-username/financial-microservice.git"

# Sélection de la branche selon l'environnement
if [ "$ENVIRONMENT" = "production" ]; then
    BRANCH="main"
else
    BRANCH="develop"
fi

echo "🚀 Déploiement en cours - Environnement: $ENVIRONMENT"

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Fonction de rollback améliorée
rollback() {
    log "❌ Erreur détectée - Rollback en cours..."
    if [ -L "$CURRENT_LINK" ]; then
        PREVIOUS_VERSION=$(ls -t "$RELEASES_DIR" | grep -v "^$VERSION$" | head -1)
        if [ -n "$PREVIOUS_VERSION" ] && [ -d "$RELEASES_DIR/$PREVIOUS_VERSION" ]; then
            rm -f "$CURRENT_LINK"
            ln -sf "$RELEASES_DIR/$PREVIOUS_VERSION" "$CURRENT_LINK"
            cd "$CURRENT_LINK"
            pm2 restart financial-microservice
            log "✅ Rollback vers $PREVIOUS_VERSION terminé"
        fi
    fi
    # Nettoyage de la version échouée
    rm -rf "$RELEASES_DIR/$VERSION"
    exit 1
}

# Piège pour rollback automatique en cas d'erreur
trap rollback ERR

# Création des répertoires nécessaires
mkdir -p "$RELEASES_DIR" "$SHARED_DIR/logs" "$SHARED_DIR/config"

# 1. Création du répertoire de release
RELEASE_DIR="$RELEASES_DIR/$VERSION"
log "📦 Préparation de la release $VERSION..."
mkdir -p "$RELEASE_DIR"

# 2. Clone du nouveau code
log "📥 Récupération du code source (branche: $BRANCH)..."
git clone -b "$BRANCH" "$REPO_URL" "$RELEASE_DIR"
cd "$RELEASE_DIR"

# 3. Installation des dépendances
log "📚 Installation des dépendances..."
npm ci --production

# 4. Exécution des tests
log "🧪 Exécution des tests..."
npm run test:ci

# 5. Vérification de la couverture
log "📊 Vérification de la couverture..."
npm run coverage:check

# 6. Build de l'application (si nécessaire)
log "🔨 Build de l'application..."
# npm run build (si vous avez un processus de build)

# 7. Tests de santé pré-déploiement
log "🩺 Tests de santé pré-déploiement..."
# Démarrage temporaire pour tests
PORT=3001 node index.js &
TEMP_PID=$!
sleep 5

# Test de l'endpoint de santé
if ! curl -f http://localhost:3001/health; then
    kill $TEMP_PID
    log "❌ Test de santé échoué"
    exit 1
fi

# Test des endpoints principaux
if ! curl -f "http://localhost:3001/convert?from=EUR&to=USD&amount=100"; then
    kill $TEMP_PID
    log "❌ Test de l'endpoint /convert échoué"
    exit 1
fi

kill $TEMP_PID
log "✅ Tests de santé réussis"

# 8. Arrêt de l'ancienne version
log "⏹️ Arrêt de l'ancienne version..."
pm2 stop financial-microservice || true

# 9. Déploiement de la nouvelle version
log "🔄 Déploiement de la nouvelle version..."
rm -rf "$APP_DIR/current"
mv "$APP_DIR/new" "$APP_DIR/current"
cd "$APP_DIR/current"

# 10. Redémarrage avec PM2
log "🔄 Redémarrage de l'application..."
pm2 start ecosystem.config.js --env $ENVIRONMENT
pm2 save

# 11. Tests de santé post-déploiement
log "🩺 Tests de santé post-déploiement..."
sleep 10

for i in {1..5}; do
    if curl -f http://localhost:3000/health; then
        log "✅ Service opérationnel"
        break
    else
        log "⏳ Tentative $i/5 - Service non encore disponible..."
        sleep 5
    fi
    
    if [ $i -eq 5 ]; then
        log "❌ Service non disponible après déploiement"
        rollback
    fi
done

# 12. Tests fonctionnels post-déploiement
log "🧪 Tests fonctionnels post-déploiement..."
if ! curl -f "http://localhost:3000/convert?from=EUR&to=USD&amount=100"; then
    log "❌ Test fonctionnel échoué"
    rollback
fi

# 13. Nettoyage
log "🧹 Nettoyage..."
rm -rf "$APP_DIR/previous"

# 14. Rechargement Nginx
log "🔄 Rechargement Nginx..."
sudo nginx -t && sudo systemctl reload nginx

log "🎉 Déploiement terminé avec succès !"
log "📊 Statut PM2:"
pm2 status

log "📈 Logs en temps réel:"
echo "Pour suivre les logs: pm2 logs financial-microservice"
echo "Pour voir le statut: pm2 status"
echo "Pour redémarrer: pm2 restart financial-microservice"
