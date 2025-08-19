# 📱 Caisse Secours Collecte - Application Mobile

Application mobile pour la collecte de transactions, intégrée avec l'application desktop principale.

## 🚀 Utilisation rapide

### Développement
```bash
cd mobile/caisse-secours
npm run dev  # Test en navigateur
```

### Build Android
```bash
cd mobile/caisse-secours
./build-android.bat  # Build APK complet
```

## ✨ Fonctionnalités

- **👥 Gestion clients** : Liste et ajout de clients
- **💳 Transactions** : Dépôts/retraits avec solde temps réel  
- **📤 Export intelligent** : JSON compatible app principale
- **📥 Import clients** : Synchronisation depuis app principale
- **📱 100% hors ligne** : Fonctionne sans connexion
- **🎯 Interface épurée** : Design cohérent

## 💾 Stockage

- **Local** : localStorage pour données offline
- **Exports** : `Documents/CaisseSecours/` sur Android
- **Format** : `CaisseSecours_Transactions_YYYY-MM-DD_HHhMMhSS.json`

## 🔄 Synchronisation

**Export mobile → Import desktop :**
1. Exporter transactions mobile
2. Fichier dans `Documents/CaisseSecours/`
3. Importer dans app desktop via interface batch

**Export desktop → Import mobile :**
1. Exporter clients depuis desktop
2. Importer via bouton "Importer clients" mobile

## 🛠️ Structure

```
mobile/caisse-secours/
├── src/
│   ├── components/     # Interface utilisateur
│   ├── lib/           # Logique métier + stockage  
│   └── types/         # Définitions TypeScript
├── android/           # Projet Android natif
└── build-android.bat  # Script de build
```

## 📋 Prérequis

- **Node.js 18+**
- **Android Studio** (pour build APK)
- **Gradle** installé globalement

L'app **Caisse Secours** (nom système) affiche **Caisse Secours Collecte** dans l'interface.

**Simple, efficace, intégré ! 🎯**