# 🏦 Microservice de Conversion et Calculs Financiers

Un microservice REST Node.js pour effectuer des conversions de devises et des calculs financiers simples.

## 📋 Sommaire

-   [Fonctionnalités](#fonctionnalités)
-   [API Endpoints](#api-endpoints)
-   [Installation](#installation)
-   [Utilisation](#utilisation)
-   [Tests](#tests)
-   [CI/CD](#cicd)
-   [Déploiement CI/CD](#déploiement-cicd)
-   [Architecture](#architecture)
-   [Contribution](#contribution)

## ✨ Fonctionnalités

### Conversions de Devises

-   ✅ Conversion EUR ↔ USD (1 EUR = 1.1 USD)
-   ✅ Conversion USD ↔ GBP (1 USD = 0.8 GBP)
-   ✅ Taux de change fixes selon les spécifications

### Calculs Financiers

-   ✅ Calcul de montant TTC à partir du HT et du taux de TVA
-   ✅ Application de remises sur un prix donné
-   ✅ Validation complète des entrées

### Qualité et Robustesse

-   ✅ Couverture de tests >= 80%
-   ✅ Tests unitaires, fonctionnels, d'intégration et E2E
-   ✅ Pipeline CI/CD complet
-   ✅ Gestion d'erreurs robuste

## 🚀 API Endpoints

### 💱 Conversion de Devises

```http
GET /convert?from=EUR&to=USD&amount=100
```

**Réponse:**

```json
{
    "from": "EUR",
    "to": "USD",
    "originalAmount": 100,
    "convertedAmount": 110
}
```

**Conversions supportées:**

-   `EUR` → `USD` (taux: 1.1)
-   `USD` → `GBP` (taux: 0.8)
-   `USD` → `EUR` (taux: ~0.91)
-   `GBP` → `USD` (taux: 1.25)

### 🧾 Calcul TVA

```http
GET /tva?ht=100&taux=20
```

**Réponse:**

```json
{
    "ht": 100,
    "taux": 20,
    "ttc": 120
}
```

### 🏷️ Calcul de Remise

```http
GET /remise?prix=100&pourcentage=10
```

**Réponse:**

```json
{
    "prixInitial": 100,
    "pourcentage": 10,
    "prixFinal": 90
}
```

### 🔍 Endpoints Utilitaires

#### Santé du Service

```http
GET /health
```

#### Taux de Change Disponibles

```http
GET /rates
```

## 🛠 Installation

### Prérequis

-   Node.js >= 18.x
-   npm >= 8.x

### Installation des dépendances

```bash
# Cloner le repository
git clone <repository-url>
cd tests-CI

# Installer les dépendances
npm install
```

## 🏃‍♂️ Utilisation

### Démarrage du serveur

```bash
# Démarrage en mode production
npm start

# Démarrage en mode développement
npm run dev
```

Le serveur démarre sur le port 3000 par défaut.

### Variables d'environnement

```bash
PORT=3000  # Port du serveur (défaut: 3000)
```

## 🧪 Tests

Ce projet inclut une suite complète de tests avec différents niveaux:

### Types de Tests

#### Tests Unitaires

```bash
npm run test:unit
```

-   Tests des services `ConversionService` et `FinancialService`
-   Validation de la logique métier
-   Tests des cas limites

#### Tests Fonctionnels

```bash
npm run test:functional
```

-   Tests des routes API
-   Validation des codes de retour HTTP
-   Tests de validation des paramètres

#### Tests d'Intégration

```bash
npm run test:integration
```

-   Tests avec mock d'API externe
-   Tests de résilience et fallback
-   Tests de gestion d'erreurs

#### Tests End-to-End (E2E)

```bash
npm run test:e2e
```

-   Scénarios complets multi-étapes
-   Tests de workflows métier
-   Tests de performance basiques

### Commandes de Test

```bash
# Tous les tests
npm test

# Tests avec surveillance des changements
npm run test:watch

# Rapport de couverture
npm run test:coverage

# Tests pour CI
npm run test:ci

# Vérification du seuil de couverture
npm run coverage:check
```

### Couverture de Code

Le projet maintient une couverture de code >= 80% sur:

-   Branches
-   Fonctions
-   Lignes
-   Instructions

## 🔄 CI/CD

### Pipeline GitHub Actions

Le pipeline CI/CD inclut:

1. **Setup et Validation** - Vérification de la structure du projet
2. **Tests Unitaires** - Exécution des tests unitaires
3. **Tests Fonctionnels** - Tests des APIs
4. **Tests d'Intégration** - Tests avec mocks
5. **Tests E2E** - Scénarios complets
6. **Rapport de Couverture** - Génération et vérification
7. **Tests de Performance** - Tests de charge basiques
8. **Audit de Sécurité** - Vérification des vulnérabilités
9. **Build Final** - Validation de déploiement

### Conditions d'Échec

Le pipeline échoue si:

-   ❌ Un test échoue
-   ❌ La couverture < 80%
-   ❌ Audit de sécurité détecte des vulnérabilités critiques
-   ❌ Le service ne démarre pas correctement

## 🚀 Déploiement CI/CD sur VPS

### Prérequis VPS

-   Ubuntu 20.04+ avec 2GB RAM minimum
-   Accès SSH avec clés publique/privée
-   Domaine configuré (optionnel)

### Installation rapide

1. **Préparation du VPS** :

```bash
# Connexion au VPS
ssh root@YOUR_VPS_IP

# Exécution du script d'installation
curl -sSL https://raw.githubusercontent.com/VOTRE_USERNAME/VOTRE_REPO/main/deploy/setup-vps.sh | bash
```

2. **Configuration des secrets GitHub** :

    - Consultez [docs/github-secrets-setup.md](docs/github-secrets-setup.md)
    - Configurez les secrets dans GitHub Actions

3. **Déploiement automatique** :

```bash
# Staging (branche develop)
git push origin develop

# Production (branche main)
git push origin main
```

### Monitoring et maintenance

```bash
# Vérification du statut
./deploy/monitor.sh status

# Tests de santé
./deploy/monitor.sh check

# Consultation des logs
./deploy/monitor.sh logs

# Rollback en cas de problème
./deploy/rollback.sh
```

### URLs de déploiement

-   **Staging**: http://YOUR_VPS_IP:3000 ou https://staging.votre-domaine.com
-   **Production**: http://YOUR_VPS_IP:3001 ou https://votre-domaine.com

### Environnements disponibles

-   **Develop** → **Staging** (port 3000)
-   **Main** → **Production** (port 3001)

## 🏗 Architecture

### Structure du Projet

```
tests-CI/
├── src/
│   ├── services/
│   │   ├── conversionService.js    # Logique de conversion
│   │   └── financialService.js     # Calculs financiers
│   └── routes/
│       └── apiRoutes.js            # Routes API
├── tests/
│   ├── unit/                       # Tests unitaires
│   ├── functional/                 # Tests fonctionnels
│   ├── integration/                # Tests d'intégration
│   ├── e2e/                        # Tests E2E
│   ├── setup.js                    # Configuration Jest
│   └── index.test.js               # Tests principaux
├── .github/workflows/
│   └── ci.yml                      # Pipeline CI/CD
├── index.js                        # Point d'entrée
├── jest.config.json                # Configuration Jest
└── package.json                    # Dépendances et scripts
```

### Patterns Utilisés

-   **Séparation des responsabilités** - Services métier séparés des routes
-   **Dependency Injection** - Services injectés dans les routes
-   **Error Handling** - Gestion centralisée des erreurs
-   **Validation** - Validation stricte des entrées
-   **Immutabilité** - Protection des taux de change

## 🤝 Contribution

### Workflow de Développement

1. Créer une branche feature: `git checkout -b feature/ma-feature`
2. Développer avec TDD (Test-Driven Development)
3. S'assurer que tous les tests passent: `npm test`
4. Vérifier la couverture: `npm run test:coverage`
5. Créer une Pull Request

### Standards de Code

-   **ES6+** - Utilisation des features modernes JavaScript
-   **Async/Await** - Pour la gestion asynchrone
-   **Validation stricte** - Tous les paramètres sont validés
-   **Tests obligatoires** - Nouvelle fonctionnalité = nouveaux tests
-   **Documentation** - Code commenté et README à jour

## 📈 Monitoring et Observabilité

### Endpoints de Santé

```http
GET /health
```

Retourne l'état du service et permet le monitoring externe.

### Logs Structurés

Le service génère des logs structurés pour:

-   Erreurs de validation
-   Erreurs internes
-   Demandes invalides

## 🔒 Sécurité

### Validation des Entrées

-   ✅ Vérification des types de données
-   ✅ Validation des plages de valeurs
-   ✅ Protection contre l'injection
-   ✅ Sanitisation des paramètres

### Audit de Sécurité

-   ✅ Audit automatique des dépendances
-   ✅ Vérification des vulnérabilités connues
-   ✅ Contrôle des licences

## 📊 Exemples d'Utilisation

### Scénario 1: E-commerce International

```bash
# 1. Convertir le prix EUR en USD
curl "http://localhost:3000/convert?from=EUR&to=USD&amount=99.99"

# 2. Appliquer une remise de 15%
curl "http://localhost:3000/remise?prix=109.99&pourcentage=15"

# 3. Calculer la TVA locale
curl "http://localhost:3000/tva?ht=93.49&taux=8.5"
```

### Scénario 2: Facturation B2B

```bash
# 1. Prix de base
curl "http://localhost:3000/tva?ht=1000&taux=20"

# 2. Remise fidélité
curl "http://localhost:3000/remise?prix=1200&pourcentage=5"

# 3. Conversion pour filiale étrangère
curl "http://localhost:3000/convert?from=EUR&to=USD&amount=1140"
```

## 📝 License

Ce projet est développé dans le cadre d'un exercice technique.

## 🆘 Support

Pour toute question ou problème:

1. Vérifier les logs du service
2. Consulter la documentation des tests
3. Vérifier l'état du pipeline CI/CD

---

**🎯 Objectif: Couverture >= 80% | Tests complets | Pipeline robuste**
