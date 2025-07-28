npm run :# 🚀 Démarrage Rapide - Application Microfinance

## ⚡ Installation Express (3 minutes)

```bash
# 1. Installation des dépendances
npm install

# 2. Configuration de la base de données
npm run db:setup

# 3. Démarrage de l'application
npm run serve
```

## 🔑 Connexion

- **URL** : http://localhost:3000
- **Utilisateur** : `admin`
- **Mot de passe** : `microfinance2025`

## 📊 Données de Test Incluses

L'application est pré-configurée avec :
- ✅ **5 clients** avec des soldes variés
- ✅ **Configuration de commissions par défaut** :
  - 0 - 50,000 FCFA : 2%
  - 50,001 - 100,000 FCFA : 3%
  - 100,001 - 200,000 FCFA : 4%
  - \> 200,000 FCFA : 5%

## 🎯 Premier Test

1. **Connectez-vous** avec les identifiants ci-dessus
2. **Dashboard** : Consultez les KPIs et les 5 clients pré-chargés
3. **Transactions** : Créez un dépôt de 25,000 FCFA pour "Jean Dupont"
4. **Commissions** : Lancez une collecte pour tester le système
5. **Clients** : Ajoutez un nouveau client

## 🛠️ Commandes Utiles

```bash
npm run db:reset      # Remettre à zéro la base de données
npm run db:studio     # Interface d'administration DB
npm run test:install  # Vérifier l'installation
```

## 🔧 En cas de Problème

### Base de données corrompue
```bash
npm run db:reset
```

### Erreur de dépendances
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 occupé
```bash
npm run dev -- -p 3001
```

## 📖 Documentation Complète

Consultez `README.md` pour la documentation détaillée.

---

💡 **Prêt en 3 minutes !** L'application respecte intégralement le cahier des charges fourni.