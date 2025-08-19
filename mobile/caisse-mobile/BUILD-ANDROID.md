# 🔨 Build Android - Guide Ultra Simple

## 📋 Prérequis (Une seule fois)

1. **Android Studio** : Installer depuis https://developer.android.com/studio
2. **Java JDK 17+** : Inclus avec Android Studio
3. **Android SDK** : Se configure automatiquement avec Android Studio

## 🚀 Build en 3 étapes

### 1. Build l'app web
```bash
cd mobile/caisse-mobile
npm run build
```

### 2. Sync avec Android
```bash
npx cap sync android
```

### 3. Ouvrir dans Android Studio
```bash
npx cap open android
```

## 📱 Générer l'APK

Dans Android Studio :
1. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Attendre la compilation
3. Cliquer sur **"locate"** pour trouver l'APK
4. L'APK est dans `android/app/build/outputs/apk/debug/`

## ⚡ Script automatique

Créer `build-android.bat` :
```batch
@echo off
echo 🔨 Build de l'app mobile...
npm run build
echo 📱 Sync Android...
npx cap sync android
echo ✅ Prêt ! Ouvrir Android Studio...
npx cap open android
```

## 🔧 Première installation Android Studio

1. **Ouvrir Android Studio** → **SDK Manager**
2. **SDK Platforms** → Cocher **Android 13 (API 33)**
3. **SDK Tools** → Cocher **Android SDK Build-Tools 33.0.0**
4. **Apply** → Attendre téléchargement

## 📂 Structure des fichiers

```
mobile/caisse-mobile/
├── src/               # Code React
├── dist/              # Build web (généré)
├── android/           # Projet Android (généré)
└── capacitor.config.ts
```

## 💡 Tips

- **Dev** : `npm run dev` pour tester en navigateur
- **APK Debug** : Pour tests internes
- **APK Release** : Pour distribution (nécessite signature)
- **Livereload** : `npx cap run android` pour dev en temps réel

L'app fonctionne **100% hors ligne** avec localStorage !