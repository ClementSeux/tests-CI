#!/bin/bash

# Script de déploiement automatisé pour le microservice financier
# Usage: ./deploy.sh [staging|production] [version]

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
    PORT=3001
else
    BRANCH="develop"
    PORT=3000
fi

echo "🚀 Déploiement en cours - Environnement: $ENVIRONMENT - Version: $VERSION"

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

# 4. Création des liens symboliques vers les fichiers partagés
log "🔗 Configuration des fichiers partagés..."
mkdir -p "$SHARED_DIR/logs"
rm -rf logs
ln -sf "$SHARED_DIR/logs" logs

# 5. Configuration d'environnement
log "⚙️ Configuration de l'environnement $ENVIRONMENT..."
if [ "$ENVIRONMENT" = "production" ]; then
    export NODE_ENV=production
    export PORT=3001
else
    export NODE_ENV=staging
    export PORT=3000
fi

# 6. Build de l'application (si nécessaire)
log "🔨 Build de l'application..."
# npm run build (si vous avez un processus de build)

# 7. Tests de santé pré-déploiement
log "🩺 Tests de santé pré-déploiement..."
# Démarrage temporaire pour tests
TEMP_PORT=$((PORT + 100))
PORT=$TEMP_PORT node index.js &
TEMP_PID=$!
sleep 10

# Test de l'endpoint de santé
if ! curl -f "http://localhost:$TEMP_PORT/health" >/dev/null 2>&1; then
    kill $TEMP_PID 2>/dev/null || true
    log "❌ Test de santé échoué"
    exit 1
fi

# Test des endpoints principaux
if ! curl -f "http://localhost:$TEMP_PORT/convert?from=EUR&to=USD&amount=100" >/dev/null 2>&1; then
    kill $TEMP_PID 2>/dev/null || true
    log "❌ Test de l'endpoint /convert échoué"
    exit 1
fi

kill $TEMP_PID 2>/dev/null || true
log "✅ Tests de santé pré-déploiement réussis"

# 8. Arrêt de l'application actuelle
log "⏹️ Arrêt de l'application actuelle..."
pm2 stop financial-microservice || true

# 9. Mise à jour du lien symbolique
log "🔗 Mise à jour du lien symbolique..."
rm -f "$CURRENT_LINK"
ln -sf "$RELEASE_DIR" "$CURRENT_LINK"

# 10. Redémarrage avec PM2
log "🔄 Redémarrage de l'application..."
cd "$CURRENT_LINK"
pm2 start ecosystem.config.js --env "$ENVIRONMENT"
pm2 save

# 11. Tests de santé post-déploiement
log "🩺 Tests de santé post-déploiement..."
sleep 15

for i in {1..10}; do
    if curl -f "http://localhost:$PORT/health" >/dev/null 2>&1; then
        log "✅ Service opérationnel"
        break
    else
        log "⏳ Tentative $i/10 - Service non encore disponible..."
        sleep 5
    fi
    
    if [ $i -eq 10 ]; then
        log "❌ Service non disponible après déploiement"
        rollback
    fi
done

# 12. Tests fonctionnels post-déploiement
log "🧪 Tests fonctionnels post-déploiement..."
if ! curl -f "http://localhost:$PORT/convert?from=EUR&to=USD&amount=100" >/dev/null 2>&1; then
    log "❌ Test fonctionnel échoué"
    rollback
fi

# 13. Nettoyage des anciennes releases (garde les 5 dernières)
log "🧹 Nettoyage des anciennes releases..."
cd "$RELEASES_DIR"
ls -t | tail -n +6 | xargs rm -rf 2>/dev/null || true

# 14. Rechargement Nginx
log "🔄 Rechargement Nginx..."
sudo nginx -t && sudo systemctl reload nginx

# 15. Notification de succès
log "🎉 Déploiement terminé avec succès !"
log "📊 Version déployée: $VERSION"
log "🌐 Environnement: $ENVIRONMENT"
log "🔗 Port: $PORT"

log "📈 Statut PM2:"
pm2 status

log "📊 Espace disque:"
df -h "$APP_DIR"

log "📝 Logs disponibles:"
echo "  - Application: pm2 logs financial-microservice"
echo "  - Système: tail -f /var/log/syslog"
echo "  - Nginx: tail -f /var/log/nginx/access.log"

log "🔧 Commandes utiles:"
echo "  - Status: pm2 status"
echo "  - Restart: pm2 restart financial-microservice"
echo "  - Rollback: ./rollback.sh"
echo "  - Monitor: pm2 monit"

# Création d'un fichier de version
echo "$VERSION" > "$CURRENT_LINK/VERSION"
echo "$(date)" > "$CURRENT_LINK/DEPLOYED_AT"
echo "$ENVIRONMENT" > "$CURRENT_LINK/ENVIRONMENT"
