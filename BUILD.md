# 🏗️ Caisse Secours - Build Process

## 📋 Scripts disponibles

### 🔧 Développement
```bash
npm run electron:dev    # Lance l'app en mode développement
```

### 🏭 Production

```bash
# 1. Build l'application Next.js + prépare les fichiers
npm run build:app

# 2. Crée l'exécutable portable
npm run create:portable

# 3. Nettoie tous les fichiers générés
npm run clean
```

## 📁 Structure générée

```
built-app/              # Application prête pour packaging
├── electron/           # Electron main process
├── standalone/         # Next.js standalone app
├── database.db         # Base de données
├── package.json        # Config minimale
└── start.bat          # Script de test

portable-app/           # Application exécutable finale
├── Caisse Secours-win32-x64/
│   └── Caisse Secours.exe  # ← VOTRE EXÉCUTABLE
└── Launch Caisse Secours.bat  # ← LANCEUR RAPIDE
```

## 🚀 Comment déployer

1. **Build complet :**
   ```bash
   npm run build:app
   npm run create:portable
   ```

2. **Distribuer :**
   - Copiez tout le dossier `portable-app/`
   - Double-cliquez sur `Launch Caisse Secours.bat`
   - Ou naviguez vers `Caisse Secours.exe`

3. **Nettoyer après tests :**
   ```bash
   npm run clean
   ```

## ⚡ Processus simplifié

```
Source Code → build:app → built-app/ → create:portable → portable-app/
                                                            ↓
                                                    READY TO SHIP! 🎉
```

## 🎯 Avantages de cette approche

- ✅ **Simple** - Seulement 3 scripts nécessaires  
- ✅ **Portable** - Fonctionne sur tout PC Windows
- ✅ **Propre** - Séparation claire dev/prod
- ✅ **Rapide** - Build optimisé
- ✅ **Maintenable** - Code clair et documenté
