# Guide de Déploiement - Caisse Secours

## Vue d'ensemble

Ce guide explique comment créer et déployer des versions de production de l'application Caisse Secours avec le système de mise à jour automatique via GitHub Releases.

## Prérequis

- Node.js installé (version 18+)
- Git configuré
- Accès au repository GitHub
- Permissions pour créer des releases sur GitHub

## Structure du système de build

```
scripts/
├── build-app.js        # Build Next.js standalone
├── create-portable.js  # Crée l'exécutable portable
├── create-release.js   # Package complet pour release
└── clean.js           # Nettoyage des fichiers temporaires
```

## Processus de release

### 1. Préparation de la version

1. **Mise à jour de la version dans `package.json`**
   ```json
   {
     "version": "1.3.0"  // Nouvelle version
   }
   ```

2. **Commit des changements**
   ```bash
   git add .
   git commit -m "chore: bump version to 1.3.0"
   git push origin main
   ```

### 2. Création du package de release

Exécuter le script de release complet :

```bash
npm run create:release
```

Ce script va :
- ✅ Builder l'application Next.js
- ✅ Créer l'exécutable portable
- ✅ Packager tous les fichiers nécessaires
- ✅ Créer l'archive ZIP finale
- ✅ Nettoyer les fichiers temporaires

**Sortie attendue :**
```
🚀 Creating release package...
📦 Building version 1.3.0...
🏗️ Building application...
📱 Creating portable executable...
📦 Creating release archive...
🗜️ Creating ZIP archive: Caisse-Secours-v1.3.0-portable.zip
🎉 Release package created successfully!
```

### 3. Création de la GitHub Release

1. **Aller sur GitHub**
   - Repository → Releases → "Create a new release"

2. **Configuration de la release**
   - **Tag version** : `v1.3.0` (doit commencer par 'v')
   - **Release title** : `Caisse Secours v1.3.0`
   - **Description** : Notes de version

3. **Upload de l'asset**
   - Uploader le fichier `Caisse-Secours-v1.3.0-portable.zip`
   - **Important** : Le nom doit suivre le pattern `Caisse-Secours-v*.zip`

4. **Publication**
   - Cliquer sur "Publish release"

### 4. Vérification

Le système de mise à jour recherche :
- ✅ Releases avec tag commençant par 'v'
- ✅ Assets nommés `Caisse-Secours-v*.zip`
- ✅ Versions plus récentes que l'actuelle

## Scripts disponibles

### Build individuel
```bash
# Build seulement l'application
npm run build:app

# Créer seulement l'exécutable
npm run create:portable

# Nettoyer les fichiers temporaires
npm run clean
```

### Build complet
```bash
# Process complet de release
npm run create:release
```

## Structure de l'archive de release

```
Caisse-Secours-v1.3.0-portable.zip
├── Caisse Secours/                  # Dossier principal
│   ├── Caisse Secours.exe          # Exécutable principal
│   ├── resources/                   # Resources Electron
│   ├── locales/                     # Fichiers de localisation
│   └── ...                          # Autres fichiers Electron
├── Launch Caisse Secours.bat       # Lanceur rapide
└── README.txt                       # Instructions d'installation
```

## Résolution de problèmes

### Erreur de build Next.js
```bash
# Nettoyer et recommencer
npm run clean
npm install
npm run create:release
```

### Erreur electron-packager
- Vérifier que toutes les dépendances sont installées
- S'assurer que le dossier `built-app` contient bien le server.js

### Problème de ZIP
- PowerShell doit être disponible
- Droits d'écriture dans le répertoire

### Update non détecté
- Vérifier le format du tag GitHub (`v1.3.0`)
- Vérifier le nom de l'asset (`Caisse-Secours-v*.zip`)
- Tester l'API : `GET /api/update/check`

## Changelog automatique

Pour améliorer le processus, considérer :
- Génération automatique de changelog
- Integration avec GitHub Actions
- Tests automatiques avant release

## Sécurité

- ⚠️ Ne jamais committer les fichiers builds
- ⚠️ Vérifier les permissions de téléchargement
- ⚠️ Tester chaque release en local avant publication

## Support utilisateur

Les utilisateurs verront automatiquement :
- 🔔 Notification de nouvelle version disponible
- 📥 Bouton de téléchargement direct
- 📋 Instructions de mise à jour

La mise à jour reste **manuelle** et **optionnelle** selon les besoins.
