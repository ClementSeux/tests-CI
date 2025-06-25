#!/bin/bash

# Script de monitoring pour le microservice financier
# Usage: ./monitor.sh [check|status|logs|restart|full]

ACTION=${1:-status}
APP_DIR="/var/www/financial-microservice"
CURRENT_LINK="$APP_DIR/current"

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Fonction de vérification de santé
health_check() {
    local endpoint=$1
    local expected_status=${2:-200}
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null)
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# Vérification complète de santé
full_health_check() {
    log "🩺 Vérification complète de santé..."
    
    # Check process PM2
    if ! pm2 describe financial-microservice | grep -q "online"; then
        log "❌ Process PM2 non actif"
        return 1
    fi
    
    # Check endpoint santé
    if ! health_check "http://localhost:3000/health"; then
        log "❌ Endpoint /health non accessible"
        return 1
    fi
    
    # Check endpoint principal
    if ! health_check "http://localhost:3000/convert?from=EUR&to=USD&amount=100"; then
        log "❌ Endpoint /convert non fonctionnel"
        return 1
    fi
    
    # Check utilisation mémoire
    memory_usage=$(pm2 describe financial-microservice | grep "memory usage" | awk '{print $3}' | sed 's/MB//')
    if [ -n "$memory_usage" ] && [ "$memory_usage" -gt 500 ]; then
        log "⚠️ Utilisation mémoire élevée: ${memory_usage}MB"
    fi
    
    # Check CPU
    cpu_usage=$(pm2 describe financial-microservice | grep "cpu usage" | awk '{print $3}' | sed 's/%//')
    if [ -n "$cpu_usage" ] && [ "$cpu_usage" -gt 80 ]; then
        log "⚠️ Utilisation CPU élevée: ${cpu_usage}%"
    fi
    
    log "✅ Toutes les vérifications passées"
    return 0
}

# Affichage du statut
show_status() {
    log "📊 Statut du microservice financier"
    echo "=================================="
    
    # Version actuelle
    if [ -f "$CURRENT_LINK/VERSION" ]; then
        echo "Version: $(cat $CURRENT_LINK/VERSION)"
    fi
    
    if [ -f "$CURRENT_LINK/DEPLOYED_AT" ]; then
        echo "Déployé le: $(cat $CURRENT_LINK/DEPLOYED_AT)"
    fi
    
    if [ -f "$CURRENT_LINK/ENVIRONMENT" ]; then
        echo "Environnement: $(cat $CURRENT_LINK/ENVIRONMENT)"
    fi
    
    echo ""
    
    # Statut PM2
    echo "📈 Statut PM2:"
    pm2 describe financial-microservice 2>/dev/null || echo "❌ Process non trouvé"
    
    echo ""
    
    # Statut Nginx
    echo "🌐 Statut Nginx:"
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx actif"
    else
        echo "❌ Nginx inactif"
    fi
    
    echo ""
    
    # Utilisation des ressources
    echo "💾 Utilisation des ressources:"
    echo "Disque: $(df -h $APP_DIR | tail -1 | awk '{print $5 " utilisé"}')"
    echo "Mémoire: $(free -h | grep Mem | awk '{print $3 "/" $2 " utilisé"}')"
    echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
    
    echo ""
    
    # Dernières erreurs
    echo "🚨 Dernières erreurs (5 dernières minutes):"
    journalctl --since "5 minutes ago" -u nginx | grep -i error | tail -5 2>/dev/null || echo "Aucune erreur récente"
}

# Affichage des logs
show_logs() {
    local lines=${2:-50}
    log "📝 Logs du microservice (dernières $lines lignes):"
    pm2 logs financial-microservice --lines "$lines"
}

# Redémarrage du service
restart_service() {
    log "🔄 Redémarrage du service..."
    pm2 restart financial-microservice
    sleep 5
    
    if full_health_check; then
        log "✅ Service redémarré avec succès"
    else
        log "❌ Problème après redémarrage"
        return 1
    fi
}

# Nettoyage automatique
cleanup() {
    log "🧹 Nettoyage automatique..."
    
    # Nettoyage des logs PM2 (garde 7 jours)
    pm2 flush
    
    # Nettoyage des logs système anciens
    find /var/log -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # Nettoyage des anciennes releases (garde 10)
    if [ -d "$APP_DIR/releases" ]; then
        cd "$APP_DIR/releases"
        ls -t | tail -n +11 | xargs rm -rf 2>/dev/null || true
    fi
    
    log "✅ Nettoyage terminé"
}

# Génération de rapport de santé
generate_report() {
    local report_file="/tmp/health-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== RAPPORT DE SANTÉ - $(date) ==="
        echo ""
        show_status
        echo ""
        echo "=== HEALTH CHECK ==="
        full_health_check
        echo ""
        echo "=== DERNIERS LOGS (20 lignes) ==="
        pm2 logs financial-microservice --lines 20
    } > "$report_file"
    
    log "📄 Rapport généré: $report_file"
    echo "$report_file"
}

# Menu principal
case $ACTION in
    "check")
        full_health_check
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$@"
        ;;
    "restart")
        restart_service
        ;;
    "cleanup")
        cleanup
        ;;
    "report")
        generate_report
        ;;
    "full")
        log "🔍 Analyse complète..."
        show_status
        echo ""
        full_health_check
        echo ""
        show_logs "20"
        ;;
    *)
        echo "Usage: $0 [check|status|logs|restart|cleanup|report|full]"
        echo ""
        echo "Actions disponibles:"
        echo "  check   - Vérification de santé rapide"
        echo "  status  - Affichage du statut détaillé"
        echo "  logs    - Affichage des logs (optionnel: nombre de lignes)"
        echo "  restart - Redémarrage du service"
        echo "  cleanup - Nettoyage automatique"
        echo "  report  - Génération d'un rapport complet"
        echo "  full    - Analyse complète (status + check + logs)"
        exit 1
        ;;
esac
