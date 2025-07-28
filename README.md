# 🏦 Application de Gestion Microfinance

Une application web moderne et minimaliste pour la gestion d'une microfinance, développée avec NextJS et TypeScript.

## ✨ Fonctionnalités

### 🔐 Authentification
- Connexion sécurisée avec session
- Protection de toutes les routes

### 👥 Gestion des Clients
- ✅ Création, modification, suppression des clients
- ✅ Génération automatique de matricules
- ✅ Recherche et filtrage en temps réel
- ✅ Calcul automatique des soldes et totaux

### 💰 Gestion des Transactions
- ✅ Dépôts et retraits
- ✅ Mise à jour automatique des soldes
- ✅ Validation des soldes insuffisants
- ✅ Historique complet avec filtres
- ✅ Statistiques en temps réel

### 📊 Tableau de Bord
- ✅ KPIs principaux (clients, transactions, commissions)
- ✅ Vue d'ensemble de l'activité
- ✅ Interface intuitive et responsive

### 💼 Système de Commissions (En développement)
- Configuration des tranches de commission
- Collecte mensuelle automatique
- Historique et rapports

## 🛠️ Technologies

- **Frontend & Backend**: NextJS 15 (App Router)
- **Base de données**: SQLite + Better-sqlite3
- **ORM**: Drizzle ORM
- **Authentification**: JWT avec José
- **UI**: Tailwind CSS + Lucide React
- **Notifications**: Sonner
- **TypeScript**: Support complet

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation

1. **Naviguer dans le dossier**
   ```bash
   cd microfinance-app
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer la base de données**
   ```bash
   npm run db:setup
   ```
   Cette commande va :
   - Générer le schéma de base de données
   - Créer les tables SQLite
   - Insérer des données de test (5 clients avec soldes)

4. **Lancer l'application**
   ```bash
   npm run serve
   ```
   ou simplement
   ```bash
   npm run dev
   ```

5. **Accéder à l'application**
   Ouvrez [http://localhost:3000](http://localhost:3000)

## 🔑 Identifiants de Connexion

- **Nom d'utilisateur**: `admin`
- **Mot de passe**: `microfinance2025`

## 📁 Structure du Projet

```
src/
├── app/                 # Pages et API routes (App Router)
│   ├── api/            # API endpoints
│   ├── dashboard/      # Tableau de bord
│   ├── clients/        # Gestion des clients
│   ├── transactions/   # Gestion des transactions
│   └── login/          # Page de connexion
├── components/         # Composants réutilisables
├── lib/               # Utilitaires et services
│   ├── auth/          # Système d'authentification
│   ├── db/            # Configuration base de données
│   └── services/      # Services métier
└── types/             # Types TypeScript
```

## 📊 Base de Données

### Tables Principales

- **clients**: Informations des clients
- **transactions**: Dépôts et retraits
- **commissions**: Commissions mensuelles
- **commission_config**: Configuration des tranches

### Relations
- Client → Transactions (1:N)
- Client → Commissions (1:N)

## 🔧 Scripts Disponibles

```bash
npm run serve        # Démarrer avec vérifications
npm run dev          # Démarrer en développement
npm run build        # Construire pour production
npm run start        # Démarrer en production
npm run lint         # Vérifier le code

# Base de données
npm run db:setup     # Configuration complète (recommandé)
npm run db:reset     # Remettre à zéro et reconfigurer
npm run db:generate  # Générer les migrations
npm run db:migrate   # Appliquer les migrations
npm run db:seed      # Insérer des données test
npm run db:studio    # Interface admin base de données
```

## 🎯 Utilisation

### 1. Gestion des Clients
- Ajoutez vos clients avec matricule, nom et téléphone
- Les matricules sont générés automatiquement (CLT001, CLT002...)
- Recherchez par nom, matricule ou téléphone
- Consultez les soldes et historiques en temps réel

### 2. Transactions
- Sélectionnez un client et le type (dépôt/retrait)
- Le système vérifie automatiquement les soldes suffisants
- Les soldes sont mis à jour en temps réel
- Historique complet avec filtres et recherche

### 3. Commissions
- Configurez les tranches de commission (ex: 0-50k=2%, 50k-100k=3%)
- Lancez la collecte mensuelle automatique
- Prévisualisez les calculs avant validation
- Historique complet par client et par mois

### 4. Tableau de Bord
- Consultez les KPIs principaux en temps réel
- Suivez l'évolution des transactions (graphiques)
- Top clients par solde
- Dernières transactions

## 🔒 Sécurité

- Authentification JWT sécurisée
- Protection CSRF native NextJS
- Validation des données côté serveur
- Sessions avec expiration automatique

## 🎨 Design

Interface minimaliste inspirée du design Jony Ive :
- Couleurs : Blanc dominant, Or (#f59e0b), Noir
- Typographie : Inter
- Espaces généreux et hiérarchie claire

## 📈 Prochaines Étapes

- [ ] Système de commissions par tranches
- [ ] Rapports et exports PDF
- [ ] Dashboard analytique avancé
- [ ] Application mobile (Flutter)
- [ ] Backup automatique

## 🐛 Dépannage

### Base de données
Si problème avec la base de données :
```bash
rm database.db
npm run db:setup
```

### Dépendances
Si problème d'installation :
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📄 Licence

Projet privé - Tous droits réservés

---

💡 **Note**: Les identifiants par défaut doivent être changés en production pour des raisons de sécurité.