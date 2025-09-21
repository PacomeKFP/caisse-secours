# Système de Mise à Jour - Caisse Secours

Ce document décrit le nouveau système de mise à jour indépendant pour l'application Caisse Secours.

## Vue d'ensemble

Le système de mise à jour a été remplacé par un programme console indépendant qui :

1. ✅ Vérifie automatiquement les derniers tags sur GitHub
2. ✅ Compare avec la version actuelle (package.json)
3. ✅ Sauvegarde automatiquement la base de données
4. ✅ Effectue un `git pull` du nouveau tag
5. ✅ Installe les dépendances (`npm install`)
6. ✅ Build l'application (`npm run build:app`)
7. ✅ Crée l'exécutable portable (`npm run create:portable`)
8. ✅ Gère les erreurs avec rollback automatique

## Utilisation

### Option 1: Script Node.js (recommandé)

```bash
# Vérification et mise à jour interactive
node updater.js

# Mode automatique (pas de confirmation)
node updater.js --auto
node updater.js -y

# Afficher l'aide
node updater.js --help
```

### Option 2: Script Batch Windows

```cmd
REM Mode interactif (demande confirmation)
update.bat

REM Mode automatique
update.bat --auto
update.bat -y
```

## Fonctionnalités

### 🔍 Vérification Intelligente
- Interroge l'API GitHub pour récupérer les tags
- Reconnaît le format de tags `caisse-secours-v*` (ex: `caisse-secours-v1.2`)
- Compare les versions sémantiques (1.2.0 vs 1.2.1)

### 💾 Sauvegarde Automatique
- Crée un dossier `backups/` dans le projet
- Sauvegarde `database.db` avec timestamp
- Format: `database_backup_YYYY-MM-DDTHH-MM-SS.db`

### 🔄 Processus de Mise à Jour
1. **Sauvegarde** de la base de données
2. **Git fetch** pour récupérer les derniers tags
3. **Git checkout** vers le tag cible
4. **npm install** pour les dépendances
5. **npm run build:app** pour builder l'application
6. **npm run create:portable** pour l'exécutable

### 🛡️ Gestion d'Erreurs
- Rollback automatique vers `master` en cas d'erreur
- Messages d'erreur détaillés
- Codes de retour appropriés (0 = succès, 1 = erreur)

## Structure des Fichiers

```
/
├── updater.js          # Script principal Node.js
├── update.bat          # Script batch Windows
├── backups/            # Dossier des sauvegardes BD
│   ├── database_backup_2025-09-22T10-30-45.db
│   └── database_backup_2025-09-22T11-15-20.db
└── package.json        # Version actuelle de référence
```

## Messages d'État

### ✅ Succès
```
✅ Vous avez déjà la dernière version !
🎉 MISE À JOUR TERMINÉE AVEC SUCCÈS !
```

### ⚠️ Informations
```
🆕 Nouvelle version disponible: 1.3.0
💾 Base de données sauvegardée: database_backup_2025-09-22T10-30-45.db
```

### ❌ Erreurs
```
❌ Erreur lors de la vérification: GitHub API error: 403
❌ ERREUR LORS DE LA MISE À JOUR
🔙 Tentative de rollback vers master...
```

## Prérequis

- **Node.js** installé et accessible dans le PATH
- **Git** configuré avec accès au dépôt
- Connexion Internet pour accéder à GitHub
- Droits d'écriture dans le répertoire du projet

## Dépannage

### Problème: "Node.js n'est pas installé"
**Solution**: Installer Node.js depuis https://nodejs.org/

### Problème: "GitHub API error: 403"
**Solution**: Vérifier la connexion Internet ou attendre (limite de taux GitHub)

### Problème: "git checkout failed"
**Solution**: Vérifier que le répertoire Git est propre (`git status`)

### Problème: "npm install failed"
**Solution**: Supprimer `node_modules/` et `package-lock.json` puis relancer

## Différences avec l'Ancien Système

| Aspect | Ancien Système | Nouveau Système |
|--------|----------------|-----------------|
| **Interface** | Interface web intégrée | Programme console indépendant |
| **Dépendances** | API routes Next.js | Script Node.js autonome |
| **Sauvegarde BD** | Manuelle | Automatique avec timestamp |
| **Gestion erreurs** | Limitée | Rollback automatique |
| **Flexibilité** | Mode web uniquement | Scripts batch + Node.js |
| **Maintenance** | Couplé à l'app | Indépendant et portable |

## Sécurité

- ✅ Sauvegarde automatique avant toute modification
- ✅ Rollback en cas d'erreur
- ✅ Validation des versions avant update
- ✅ Pas de modification des fichiers système
- ✅ Logging détaillé des opérations

---

*Dernière mise à jour: 22 septembre 2025*
