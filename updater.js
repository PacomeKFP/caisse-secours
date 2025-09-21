#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Script de mise à jour automatique pour Caisse Secours
 * 
 * Ce script :
 * 1. Vérifie les derniers tags sur GitHub
 * 2. Compare avec la version actuelle
 * 3. Fait un pull du nouveau tag
 * 4. Installe les dépendances
 * 5. Build l'application
 * 6. Crée l'exécutable portable
 * 7. Sauvegarde la base de données avant de remplacer
 */

class CaisseSecoursUpdater {
  constructor() {
    this.owner = 'PacomeKFP';
    this.repo = 'caisse-secours';
    this.projectPath = process.cwd();
    this.backupPath = path.join(this.projectPath, 'backups');
    
    console.log('🏦 Caisse Secours - Script de Mise à Jour');
    console.log('==========================================');
    console.log(`📁 Répertoire de travail: ${this.projectPath}`);
  }

  /**
   * Lit la version actuelle depuis package.json
   */
  getCurrentVersion() {
    try {
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      console.error('❌ Erreur lors de la lecture de package.json:', error.message);
      return '0.0.0';
    }
  }

  /**
   * Fait un appel HTTP GET vers l'API GitHub
   */
  async fetchGitHubAPI(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `https://api.github.com/repos/${this.owner}/${this.repo}${endpoint}`;
      
      https.get(url, {
        headers: {
          'User-Agent': 'CaisseSecours-Updater/1.0',
          'Accept': 'application/vnd.github.v3+json'
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error('Erreur lors du parsing JSON'));
            }
          } else {
            reject(new Error(`GitHub API error: ${res.statusCode}`));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Vérifie s'il y a une nouvelle version disponible
   */
  async checkForUpdates() {
    try {
      console.log('🔍 Vérification des mises à jour...');
      
      const currentVersion = this.getCurrentVersion();
      console.log(`📋 Version actuelle: ${currentVersion}`);
      
      // Récupérer les tags depuis GitHub
      const tags = await this.fetchGitHubAPI('/tags');
      
      if (!Array.isArray(tags) || tags.length === 0) {
        throw new Error('Aucun tag trouvé sur le dépôt');
      }
      
      // Trouver le tag le plus récent qui suit le pattern caisse-secours-v*
      const latestTag = tags.find(tag => tag.name.match(/^caisse-secours-v\d+\.\d+/));
      
      if (!latestTag) {
        throw new Error('Aucune version taguée trouvée (format attendu: caisse-secours-v*)');
      }
      
      const latestVersion = latestTag.name.replace('caisse-secours-v', '');
      console.log(`🆕 Dernière version disponible: ${latestVersion}`);
      
      // Comparer les versions
      const hasUpdate = this.compareVersions(latestVersion, currentVersion) > 0;
      
      return {
        hasUpdate,
        currentVersion,
        latestVersion,
        tagName: latestTag.name
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error.message);
      return null;
    }
  }

  /**
   * Compare deux versions sémantiques
   */
  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part > v2part) return 1;
      if (v1part < v2part) return -1;
    }
    
    return 0;
  }

  /**
   * Crée le dossier de sauvegarde s'il n'existe pas
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
      console.log(`📁 Dossier de sauvegarde créé: ${this.backupPath}`);
    }
  }

  /**
   * Sauvegarde la base de données
   */
  async backupDatabase() {
    try {
      console.log('💾 Sauvegarde de la base de données...');
      
      this.ensureBackupDirectory();
      
      const dbPath = path.join(this.projectPath, 'database.db');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `database_backup_${timestamp}.db`;
      const backupFilePath = path.join(this.backupPath, backupFileName);
      
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backupFilePath);
        console.log(`✅ Base de données sauvegardée: ${backupFileName}`);
        return backupFilePath;
      } else {
        console.log('⚠️ Aucune base de données trouvée à sauvegarder');
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error.message);
      return null;
    }
  }

  /**
   * Exécute une commande shell
   */
  executeCommand(command, description) {
    try {
      console.log(`🔧 ${description}...`);
      console.log(`💻 Commande: ${command}`);
      execSync(command, { 
        stdio: 'inherit',
        cwd: this.projectPath 
      });
      console.log(`✅ ${description} terminé`);
    } catch (error) {
      throw new Error(`Erreur lors de ${description.toLowerCase()}: ${error.message}`);
    }
  }

  /**
   * Effectue la mise à jour complète
   */
  async performUpdate(tagName) {
    try {
      console.log(`\n🚀 Début de la mise à jour vers ${tagName}...`);
      console.log('================================================');
      
      // 1. Sauvegarder la base de données
      const backupPath = await this.backupDatabase();
      
      // 2. Git fetch pour récupérer les derniers tags
      this.executeCommand('git fetch --tags', 'Récupération des dernières données Git');
      
      // 3. Checkout vers le tag spécifique
      this.executeCommand(`git checkout ${tagName}`, `Basculement vers ${tagName}`);
      
      // 4. Installer les dépendances
      this.executeCommand('npm install', 'Installation des dépendances');
      
      // 5. Build l'application
      this.executeCommand('npm run build:app', 'Build de l\'application');
      
      // 6. Créer l'exécutable portable
      this.executeCommand('npm run create:portable', 'Création de l\'exécutable portable');
      
      console.log('\n🎉 MISE À JOUR TERMINÉE AVEC SUCCÈS !');
      console.log('=====================================');
      console.log(`✅ Version mise à jour vers: ${tagName}`);
      
      if (backupPath) {
        console.log(`💾 Sauvegarde disponible: ${path.basename(backupPath)}`);
      }
      
      console.log('\n📝 Actions recommandées:');
      console.log('1. Redémarrer l\'application');
      console.log('2. Vérifier que tout fonctionne correctement');
      console.log('3. Tester les nouvelles fonctionnalités');
      
      return true;
      
    } catch (error) {
      console.error('\n❌ ERREUR LORS DE LA MISE À JOUR');
      console.error('==================================');
      console.error(error.message);
      
      // Tentative de rollback
      try {
        console.log('\n🔙 Tentative de rollback vers master...');
        this.executeCommand('git checkout master', 'Retour vers master');
        console.log('✅ Rollback effectué');
      } catch (rollbackError) {
        console.error('❌ Erreur lors du rollback:', rollbackError.message);
      }
      
      return false;
    }
  }

  /**
   * Lance le processus principal
   */
  async run() {
    try {
      // Vérifier les mises à jour
      const updateInfo = await this.checkForUpdates();
      
      if (!updateInfo) {
        console.log('❌ Impossible de vérifier les mises à jour');
        process.exit(1);
      }
      
      if (!updateInfo.hasUpdate) {
        console.log('✅ Vous avez déjà la dernière version !');
        console.log(`📋 Version actuelle: ${updateInfo.currentVersion}`);
        process.exit(0);
      }
      
      console.log(`\n🆕 Nouvelle version disponible: ${updateInfo.latestVersion}`);
      console.log(`📋 Version actuelle: ${updateInfo.currentVersion}`);
      
      // Demander confirmation (en mode interactif)
      if (process.argv.includes('--auto') || process.argv.includes('-y')) {
        console.log('🤖 Mode automatique activé, démarrage de la mise à jour...');
      } else {
        console.log('\n⚠️  ATTENTION: Cette opération va:');
        console.log('   - Sauvegarder votre base de données');
        console.log('   - Mettre à jour le code source');
        console.log('   - Rebuilder l\'application');
        console.log('   - Recréer l\'exécutable portable');
        console.log('\nAppuyez sur Entrée pour continuer ou Ctrl+C pour annuler...');
        
        // Attendre que l'utilisateur appuie sur Entrée
        await new Promise(resolve => {
          process.stdin.once('data', resolve);
        });
      }
      
      // Effectuer la mise à jour
      const success = await this.performUpdate(updateInfo.tagName);
      
      process.exit(success ? 0 : 1);
      
    } catch (error) {
      console.error('❌ Erreur fatale:', error.message);
      process.exit(1);
    }
  }
}

// Affichage de l'aide
function showHelp() {
  console.log(`
🏦 Caisse Secours - Script de Mise à Jour
==========================================

Usage: node updater.js [options]

Options:
  --auto, -y    Mode automatique (pas de confirmation)
  --help, -h    Afficher cette aide

Exemples:
  node updater.js              # Mode interactif
  node updater.js --auto       # Mode automatique
  node updater.js --help       # Afficher l'aide
`);
}

// Point d'entrée
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  const updater = new CaisseSecoursUpdater();
  updater.run();
}

module.exports = CaisseSecoursUpdater;
