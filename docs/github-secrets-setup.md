# Template de configuration des secrets GitHub Actions

## 🔐 Secrets à configurer dans GitHub

Allez dans votre repository GitHub > Settings > Secrets and variables > Actions

### Secrets d'Infrastructure

```bash
# Staging Environment
STAGING_HOST=xxx.xxx.xxx.xxx  # IP de votre VPS
STAGING_USER=deploy
STAGING_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...votre clé privée SSH...
-----END OPENSSH PRIVATE KEY-----
STAGING_PORT=22
STAGING_URL=http://xxx.xxx.xxx.xxx:3000  # ou https://staging.votre-domaine.com

# Production Environment  
PRODUCTION_HOST=xxx.xxx.xxx.xxx  # même IP ou différente
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...votre clé privée SSH...
-----END OPENSSH PRIVATE KEY-----
PRODUCTION_PORT=22
PRODUCTION_URL=http://xxx.xxx.xxx.xxx:3001  # ou https://votre-domaine.com

# Notifications (optionnel)
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

## 🔑 Génération des clés SSH

### 1. Sur votre machine locale :

```bash
# Génération d'une nouvelle paire de clés
ssh-keygen -t rsa -b 4096 -C "github-actions@votre-domaine.com" -f ~/.ssh/github_actions

# Affichage de la clé publique
cat ~/.ssh/github_actions.pub
```

### 2. Sur votre VPS :

```bash
# Connexion au VPS
ssh root@YOUR_VPS_IP

# Ajout de la clé publique pour l'utilisateur deploy
echo "COPIEZ_ICI_LE_CONTENU_DE_github_actions.pub" >> /home/deploy/.ssh/authorized_keys

# Vérification des permissions
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 3. Test de la connexion :

```bash
# Test depuis votre machine locale
ssh -i ~/.ssh/github_actions deploy@YOUR_VPS_IP "echo 'Connexion réussie'"
```

### 4. Ajout dans GitHub :

```bash
# Contenu à copier dans STAGING_SSH_KEY et PRODUCTION_SSH_KEY
cat ~/.ssh/github_actions
```

## 🌐 Configuration des domaines (optionnel)

### Si vous utilisez un domaine :

1. **Configuration DNS** :
   ```
   A record: votre-domaine.com → YOUR_VPS_IP
   A record: staging.votre-domaine.com → YOUR_VPS_IP
   ```

2. **Mise à jour des URLs** :
   ```bash
   STAGING_URL=https://staging.votre-domaine.com
   PRODUCTION_URL=https://votre-domaine.com
   ```

3. **Le script setup-vps.sh configurera automatiquement SSL**

## 📧 Configuration Slack (optionnel)

### 1. Création du webhook Slack :

1. Allez sur https://api.slack.com/apps
2. Créez une nouvelle app
3. Activez "Incoming Webhooks"
4. Créez un nouveau webhook pour votre canal
5. Copiez l'URL du webhook

### 2. Test du webhook :

```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test de notification depuis GitHub Actions"}' \
  YOUR_SLACK_WEBHOOK_URL
```

## 🚀 Déploiement automatique

Une fois les secrets configurés :

### Pour staging (branche develop) :
```bash
git checkout develop
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin develop
```

### Pour production (branche main) :
```bash
git checkout main
git merge develop
git push origin main
```

## 🔍 Vérification du déploiement

### 1. Dans GitHub Actions :
- Vérifiez que tous les jobs passent au vert
- Consultez les logs pour détecter d'éventuels problèmes

### 2. Sur le VPS :
```bash
# Connexion au VPS
ssh deploy@YOUR_VPS_IP

# Vérification du statut
cd /var/www/financial-microservice
./deploy/monitor.sh status

# Vérification des logs
pm2 logs financial-microservice
```

### 3. Tests fonctionnels :
```bash
# Test de santé
curl http://YOUR_VPS_IP:3000/health

# Test de conversion
curl "http://YOUR_VPS_IP:3000/convert?from=EUR&to=USD&amount=100"
```

## 🆘 En cas de problème

### Rollback manuel :
```bash
ssh deploy@YOUR_VPS_IP
cd /var/www/financial-microservice
./deploy/rollback.sh
```

### Logs de débogage :
```bash
# Logs applicatifs
pm2 logs financial-microservice

# Logs système
sudo journalctl -u nginx -f

# Logs GitHub Actions
# Consultez l'onglet Actions de votre repository
```

### Support technique :
```bash
# Génération d'un rapport complet
./deploy/monitor.sh report

# Analyse complète
./deploy/monitor.sh full
```
