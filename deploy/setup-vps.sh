#!/bin/bash

# Script de configuration initiale du VPS pour le microservice financier
# Exécuter avec: sudo bash setup-vps.sh

echo "🚀 Configuration du VPS pour le microservice financier..."

# Mise à jour du système
apt update && apt upgrade -y

# Installation de Node.js (version 18 LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Installation de PM2 pour la gestion des processus
npm install -g pm2

# Installation de Nginx comme reverse proxy
apt install -y nginx

# Installation de certbot pour SSL
apt install -y certbot python3-certbot-nginx

# Installation de Git
apt install -y git

# Installation de Docker (optionnel)
apt install -y docker.io docker-compose
systemctl enable docker
systemctl start docker

# Création de l'utilisateur pour l'application
useradd -m -s /bin/bash appuser
usermod -aG sudo appuser
usermod -aG docker appuser

# Création des répertoires de l'application
mkdir -p /var/www/financial-microservice
chown -R appuser:appuser /var/www/financial-microservice

# Configuration du firewall
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw --force enable

echo "✅ Configuration du VPS terminée !"
echo "👤 Utilisateur créé: appuser"
echo "📁 Répertoire app: /var/www/financial-microservice"
echo "🔥 Firewall configuré pour ports 22, 80, 443"
