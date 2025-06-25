#!/bin/bash

# Script de rollback pour le microservice financier
# Usage: ./rollback.sh [version] ou ./rollback.sh (rollback vers la version précédente)

set -e

APP_DIR="/var/www/financial-microservice"
RELEASES_DIR="$APP_DIR/releases"
CURRENT_LINK="$APP_DIR/current"

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Vérification des permissions
if [ "$(whoami)" != "deploy" ] && [ "$(whoami)" != "root" ]; then
    log "❌ Ce script doit être exécuté par l'utilisateur 'deploy' ou 'root'"
    exit 1
fi

log "🔄 Début du processus de rollback..."

# Liste des versions disponibles
if [ ! -d "$RELEASES_DIR" ] || [ -z "$(ls -A $RELEASES_DIR)" ]; then
    log "❌ Aucune version disponible pour le rollback"
    exit 1
fi

# Affichage des versions disponibles
log "📋 Versions disponibles :"
ls -la "$RELEASES_DIR" | grep "^d" | awk '{print $9}' | grep -v "^\.$\|^\.\.$" | sort -r | head -10

# Sélection de la version
if [ -n "$1" ]; then
    TARGET_VERSION="$1"
    if [ ! -d "$RELEASES_DIR/$TARGET_VERSION" ]; then
        log "❌ Version $TARGET_VERSION non trouvée"
        exit 1
    fi
else
    # Rollback vers la version précédente
    CURRENT_VERSION=$(readlink "$CURRENT_LINK" | xargs basename)
    TARGET_VERSION=$(ls -la "$RELEASES_DIR" | grep "^d" | awk '{print $9}' | grep -v "^\.$\|^\.\.$\|^$CURRENT_VERSION$" | sort -r | head -1)
    
    if [ -z "$TARGET_VERSION" ]; then
        log "❌ Aucune version précédente trouvée"
        exit 1
    fi
fi

TARGET_PATH="$RELEASES_DIR/$TARGET_VERSION"

log "🎯 Rollback vers la version: $TARGET_VERSION"
log "📁 Chemin: $TARGET_PATH"

# Confirmation
read -p "Confirmer le rollback vers $TARGET_VERSION ? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "🚫 Rollback annulé"
    exit 0
fi

# Sauvegarde de la version actuelle
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
if [ -L "$CURRENT_LINK" ]; then
    CURRENT_REAL_PATH=$(readlink "$CURRENT_LINK")
    log "💾 Sauvegarde de la version actuelle vers backup_$BACKUP_TIMESTAMP"
    cp -r "$CURRENT_REAL_PATH" "$RELEASES_DIR/backup_$BACKUP_TIMESTAMP"
fi

# Arrêt de l'application
log "⏹️ Arrêt de l'application..."
pm2 stop financial-microservice || log "⚠️ L'application n'était pas démarrée"

# Changement du lien symbolique
log "🔗 Mise à jour du lien symbolique..."
rm -f "$CURRENT_LINK"
ln -sf "$TARGET_PATH" "$CURRENT_LINK"

# Redémarrage de l'application
log "🚀 Redémarrage de l'application..."
cd "$CURRENT_LINK"
pm2 start ecosystem.config.js || {
    log "❌ Échec du redémarrage"
    exit 1
}

# Tests de santé
log "🩺 Tests de santé..."
sleep 10

for i in {1..5}; do
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        log "✅ Service opérationnel après rollback"
        break
    else
        log "⏳ Tentative $i/5 - Service non encore disponible..."
        sleep 5
    fi
    
    if [ $i -eq 5 ]; then
        log "❌ Service non disponible après rollback"
        exit 1
    fi
done

# Test fonctionnel
if curl -f "http://localhost:3000/convert?from=EUR&to=USD&amount=100" >/dev/null 2>&1; then
    log "✅ Test fonctionnel réussi"
else
    log "⚠️ Test fonctionnel échoué, mais le service répond"
fi

# Rechargement Nginx
log "🔄 Rechargement Nginx..."
sudo nginx -t && sudo systemctl reload nginx

log "🎉 Rollback terminé avec succès !"
log "📊 Version active: $TARGET_VERSION"
log "📈 Statut PM2:"
pm2 status

# Nettoyage automatique des anciennes sauvegardes (garde les 5 dernières)
log "🧹 Nettoyage des anciennes sauvegardes..."
cd "$RELEASES_DIR"
ls -t backup_* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true

log "💡 Pour voir les logs: pm2 logs financial-microservice"
