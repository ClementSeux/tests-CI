# Guide de Configuration VPS pour le Déploiement CI/CD

## 🎯 Prérequis VPS

### Système recommandé

-   **OS**: Ubuntu 20.04 LTS ou supérieur
-   **RAM**: Minimum 2GB (recommandé 4GB)
-   **Stockage**: Minimum 20GB SSD
-   **CPU**: 2 vCores minimum

### Accès requis

-   Accès SSH avec clé publique/privée
-   Utilisateur avec privilèges sudo
-   Domaine configuré (optionnel mais recommandé)

## 🚀 Étapes de Configuration

### 1. Connexion initiale au VPS

```bash
# Connexion SSH (remplacez par vos informations)
ssh root@YOUR_VPS_IP

# Création d'un utilisateur non-root (recommandé)
adduser deploy
usermod -aG sudo deploy

# Configuration SSH pour l'utilisateur deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 2. Exécution du script d'installation

```bash
# Basculer sur l'utilisateur deploy
su - deploy

# Télécharger et exécuter le script de setup
curl -o setup-vps.sh https://raw.githubusercontent.com/VOTRE_USERNAME/VOTRE_REPO/main/deploy/setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

### 3. Configuration des domaines (optionnel)

```bash
# Configuration DNS
# Pointez votre domaine vers l'IP du VPS :
# A record: votre-domaine.com → YOUR_VPS_IP
# A record: staging.votre-domaine.com → YOUR_VPS_IP

# Le script setup-vps.sh configurera automatiquement SSL via Let's Encrypt
```

## 🔐 Configuration des Secrets GitHub

### Secrets requis dans votre repository GitHub

Allez dans `Settings > Secrets and variables > Actions` et ajoutez :

#### Staging Environment

-   `STAGING_HOST`: IP ou domaine de votre VPS
-   `STAGING_USER`: `deploy`
-   `STAGING_SSH_KEY`: Contenu de votre clé privée SSH
-   `STAGING_PORT`: `22` (ou port SSH personnalisé)
-   `STAGING_URL`: `https://staging.votre-domaine.com` ou `http://YOUR_VPS_IP:3000`

#### Production Environment

-   `PRODUCTION_HOST`: IP ou domaine de votre VPS
-   `PRODUCTION_USER`: `deploy`
-   `PRODUCTION_SSH_KEY`: Contenu de votre clé privée SSH
-   `PRODUCTION_PORT`: `22`
-   `PRODUCTION_URL`: `https://votre-domaine.com` ou `http://YOUR_VPS_IP:3001`

#### Monitoring & Notifications

-   `SLACK_WEBHOOK`: URL webhook Slack (optionnel)

### Génération des clés SSH

```bash
# Sur votre machine locale
ssh-keygen -t rsa -b 4096 -C "deploy@votre-domaine.com"
# Sauvegardez dans ~/.ssh/vps_deploy (exemple)

# Copiez la clé publique sur le VPS
ssh-copy-id -i ~/.ssh/vps_deploy.pub deploy@YOUR_VPS_IP

# Le contenu de ~/.ssh/vps_deploy sera à mettre dans STAGING_SSH_KEY
```

## 🔧 Structure sur le VPS

Après le setup, votre VPS aura cette structure :

```
/var/www/financial-microservice/
├── current/                 # Version actuellement en production
├── releases/               # Historique des déploiements
│   ├── 20240101120000/
│   ├── 20240101150000/
│   └── ...
├── shared/                 # Fichiers partagés (logs, config)
│   ├── logs/
│   └── config/
├── deploy/                 # Scripts de déploiement
│   ├── deploy.sh
│   └── rollback.sh
└── backups/               # Sauvegardes automatiques
```

## 🚦 Tests post-installation

```bash
# Vérification des services
systemctl status nginx
systemctl status pm2-deploy

# Test de l'application
curl http://localhost:3000/health
curl "http://localhost:3000/convert?from=EUR&to=USD&amount=100"

# Vérification des logs
pm2 logs financial-microservice
tail -f /var/log/nginx/access.log
```

## 🔄 Processus de déploiement

1. **Push vers `develop`** → Déploiement automatique sur staging
2. **Push vers `main`** → Déploiement automatique sur production
3. **Pull Request** → Tests uniquement, pas de déploiement

## 📊 Monitoring disponible

-   **PM2 Monitoring**: `pm2 monit`
-   **Nginx Status**: `systemctl status nginx`
-   **Logs applicatifs**: `/var/www/financial-microservice/shared/logs/`
-   **Logs système**: `/var/log/syslog`, `/var/log/nginx/`

## 🆘 Procédures d'urgence

### Rollback rapide

```bash
cd /var/www/financial-microservice
sudo -u deploy ./deploy/rollback.sh
```

### Redémarrage des services

```bash
sudo systemctl restart nginx
sudo -u deploy pm2 restart financial-microservice
```

### Vérification de la santé

```bash
curl -f http://localhost:3000/health
```
