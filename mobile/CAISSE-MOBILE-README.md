# 💰 Caisse Mobile - App de Transaction

Application mobile ultra-simple pour enregistrer les transactions clients, conçue avec React + Capacitor.

## ✨ Fonctionnalités

- **👥 Gestion des clients** : Ajouter et lister les clients
- **💳 Transactions** : Dépôts et retraits avec solde automatique
- **📤 Export JSON** : Export intelligent avec tracking des exports
- **📱 100% hors ligne** : Fonctionne sans internet
- **🎨 Design Jony Ive** : Interface épurée et intuitive

## 🚀 Utilisation

### Développement
```bash
cd mobile/caisse-mobile
npm run dev  # Test en navigateur
```

### Build Android
```bash
cd mobile/caisse-mobile
npm run build              # Build web
npx cap sync android       # Sync Android
npx cap open android       # Ouvrir Android Studio
```

**Ou utiliser le script :**
```bash
cd mobile/caisse-mobile
./build-android.bat
```

## 📱 Navigation

1. **Liste des clients** → Cliquer sur un client
2. **Transactions du client** → Bouton + pour ajouter
3. **Modal transaction** → Remplir et sauvegarder
4. **Export** → Bouton export depuis la liste des clients

## 💾 Stockage

- **localStorage** : Données persistantes localement
- **Format compatible** : Export JSON importable dans l'app desktop
- **Tracking exports** : Évite les doublons d'export

## 🔄 Synchronisation

L'export génère un fichier JSON qui peut être importé dans l'application desktop principale via la fonction d'import batch.

## 📁 Structure

```
mobile/caisse-mobile/
├── src/
│   ├── types/           # Interfaces TypeScript
│   ├── lib/storage.ts   # Gestion localStorage
│   ├── components/      # Composants React
│   └── App.tsx         # Application principale
├── android/            # Projet Android (généré)
├── dist/              # Build web (généré)
└── BUILD-ANDROID.md   # Guide de build détaillé
```

Simple, efficace, sans prise de tête ! 🎯

## 🎯 Build Final

**L'app est prête !** Tu peux maintenant :
1. Tester en dev : `npm run dev`
2. Builder pour Android : `./build-android.bat`
3. Générer l'APK depuis Android Studio

**Format des données :** Compatible 100% avec l'application desktop pour import/export.