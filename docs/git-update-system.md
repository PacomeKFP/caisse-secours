# Système de Mise à Jour Git-based

## Vue d'ensemble

L'application Caisse Secours utilise maintenant un système de mise à jour basé sur Git qui récupère automatiquement les dernières versions depuis GitHub et rebuild l'application.

## Comment ça fonctionne

### 1. Détection des mises à jour
- L'application vérifie les **tags GitHub** (ex: `v1.3.0`)
- Compare avec la version actuelle dans `package.json`
- Affiche une notification si une nouvelle version est disponible

### 2. Processus de mise à jour
Quand l'utilisateur clique sur "Mettre à jour" :

```bash
# 1. Sauvegarde automatique de la base de données
database.db → database.db.backup-[timestamp]

# 2. Récupération des derniers tags
git fetch --tags

# 3. Basculement vers la nouvelle version
git checkout v1.3.0

# 4. Installation des dépendances
npm install

# 5. Build de l'application
npm run build:app

# 6. Création de l'exécutable (en production)
npm run create:portable
```

### 3. Interface utilisateur
- **Bouton** : "Vérifier les mises à jour" dans la sidebar
- **Notification** : Toast automatique si nouvelle version
- **Loading overlay** : Pendant le processus de mise à jour
- **Toast final** : Demande de redémarrage manuel

## Avantages

✅ **Simple** : Pas d'archives ZIP à gérer
✅ **Automatique** : Git + build scripts existants
✅ **Sécurisé** : Backup automatique de la BD
✅ **Rollback** : Retour automatique en cas d'erreur
✅ **User-friendly** : Interface claire et loading states

## Déploiement des mises à jour

### Pour créer une nouvelle version :

1. **Modifier la version**
   ```json
   // package.json
   "version": "1.3.0"
   ```

2. **Commit et push**
   ```bash
   git add .
   git commit -m "feat: nouvelle fonctionnalité XYZ"
   git push origin master
   ```

3. **Créer un tag**
   ```bash
   git tag v1.3.0
   git push origin v1.3.0
   ```

4. **Les utilisateurs verront automatiquement la notification** ✨

## Structure des fichiers

```
src/
├── lib/services/updateService.js     # Logique de mise à jour
├── app/api/update/check/route.ts     # API endpoint
└── components/UpdateChecker.tsx      # Interface utilisateur

scripts/
├── build-app.js                      # Build Next.js standalone
└── create-portable.js               # Création exécutable
```

## Sécurité et rollback

- **Backup automatique** : La BD est sauvegardée avant chaque mise à jour
- **Rollback automatique** : En cas d'erreur, retour vers `master`
- **Validation** : Vérification des dépendances et du build
- **User choice** : L'utilisateur contrôle quand mettre à jour

## Prérequis de déploiement

- ✅ Application déployée avec accès Git
- ✅ Repository GitHub avec tags de version
- ✅ Node.js et npm disponibles
- ✅ Permissions d'écriture dans le dossier

## Commandes de test

```bash
# Tester le build complet
npm run build:app
npm run create:portable

# Vérifier les tags disponibles
git tag -l

# Simuler un checkout de version
git checkout v1.2.0
git checkout master
```

Le système est maintenant **prêt pour la production** ! 🚀
