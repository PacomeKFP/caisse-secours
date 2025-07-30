# 🛠️ Guide d'implémentation Winston pour l'application Microfinance

## 📋 **Table des matières**
1. [Vue d'ensemble](#vue-densemble)
2. [Avantages et inconvénients](#avantages-et-inconvénients) 
3. [Prérequis et coûts](#prérequis-et-coûts)
4. [Plan d'implémentation](#plan-dimplémentation)
5. [Configuration détaillée](#configuration-détaillée)
6. [Monitoring et alertes](#monitoring-et-alertes)
7. [Bonnes pratiques](#bonnes-pratiques)
8. [Maintenance et évolution](#maintenance-et-évolution)

---

## 🎯 **Vue d'ensemble**

### **Qu'est-ce que Winston ?**
Winston est une bibliothèque de logging pour Node.js qui permet de capturer, formater et stocker les logs localement. Pour une application microfinance, c'est une solution qui offre :

- **Contrôle total** des données sensibles
- **Stockage local** des logs sans dépendance externe
- **Performance élevée** sans latence réseau
- **Coût zéro** en infrastructure externe
- **Conformité** aux exigences de confidentialité

### **Fonctionnalités clés pour ton projet**
- ✅ **Multi-transports** : Fichiers, console, base de données
- ✅ **Niveaux de log** : error, warn, info, debug, verbose
- ✅ **Formatage flexible** : JSON, texte, personnalisé
- ✅ **Rotation automatique** : Gestion des fichiers volumineux
- ✅ **Filtrage avancé** : Par niveau, métadonnées, etc.
- ✅ **Intégration Next.js** : Client et serveur

---

## ⚖️ **Avantages et inconvénients**

### **✅ Avantages**
- **Aucun coût récurrent** (100% gratuit)
- **Données sécurisées** (restent sur votre serveur)
- **Performance maximale** (pas de latence réseau)
- **Contrôle total** de la configuration
- **Conformité RGPD** simplifiée
- **Pas de limite** de volume
- **Fonctionnement offline** complet
- **Personnalisation infinie** des formats

### **❌ Inconvénients**
- **Infrastructure à gérer** (stockage, rotation)
- **Pas de dashboard** prêt à l'emploi
- **Alertes manuelles** à configurer
- **Analyse complexe** des gros volumes
- **Sauvegarde** à votre charge
- **Monitoring externe** nécessaire pour les alertes

### **🔒 Considérations sécurité**
- Logs stockés localement (sécurité maximale)
- Chiffrement des fichiers possible
- Accès contrôlé par permissions système
- Audit trail complet disponible

---

## 💰 **Prérequis et coûts**

### **Coûts**
- **Développement** : 0€ (bibliothèque gratuite)
- **Infrastructure** : Espace disque existant
- **Maintenance** : Temps développeur uniquement
- **Monitoring** : Solutions tierces optionnelles

### **Pour ton projet**
- **Phase 1** : Implémentation gratuite complète
- **Phase 2** : Optionnel : monitoring externe (~10€/mois)
- **Estimation totale** : 0-10€/mois selon les besoins

### **Prérequis techniques**
- ✅ **Node.js 14+** (déjà présent)
- ✅ **Espace disque** (quelques GB recommandés)
- ✅ **Permissions écriture** (pour les fichiers de log)
- ✅ **Logrotate** (recommandé pour la rotation)

---

## 🗓️ **Plan d'implémentation**

### **Phase 1: Setup de base (Semaine 1)**
```bash
Jour 1-2: Installation et configuration
├── Installation Winston + plugins
├── Configuration des transports
├── Structure des logs
└── Tests de base

Jour 3-4: Intégration application
├── Middleware de logging
├── Logging des API routes
├── Gestion des erreurs
└── Context utilisateur

Jour 5: Rotation et maintenance
├── Configuration logrotate
├── Scripts de maintenance
├── Tests de volume
└── Documentation
```

### **Phase 2: Fonctionnalités avancées (Semaine 2)**
```bash
Jour 1-2: Audit trail
├── Tracking actions utilisateur
├── Logs transactionnels
├── Métriques business
└── Corrélation des events

Jour 3-4: Monitoring et alertes
├── Scripts de surveillance
├── Seuils d'alerte
├── Notifications email/Slack
└── Dashboards simples

Jour 5: Optimisation
├── Performance tuning
├── Compression des logs
├── Archivage automatique
└── Tests de charge
```

### **Phase 3: Monitoring externe (Optionnel - Semaine 3)**
```bash
Jour 1-3: Intégration monitoring
├── ELK Stack / Grafana / Prometheus
├── Dashboards avancés
├── Alertes intelligentes
└── Métriques temps réel

Jour 4-5: Formation et documentation
├── Formation équipe
├── Procédures de maintenance
├── Guide de troubleshooting
└── Documentation finale
```

---

## ⚙️ **Configuration détaillée**

### **1. Installation des packages**

```bash
# Packages Winston essentiels
npm install winston winston-daily-rotate-file

# Packages optionnels mais recommandés
npm install express-winston morgan helmet
```

### **2. Configuration Winston**

**`lib/logging/winston.config.js`**
```javascript
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

// Configuration des niveaux personnalisés
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    audit: 2,
    info: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow', 
    audit: 'magenta',
    info: 'blue',
    debug: 'green'
  }
}

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json()
)

// Transport pour les erreurs (fichier séparé)
const errorTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: logFormat
})

// Transport pour tous les logs
const combinedTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat
})

// Transport pour l'audit trail
const auditTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '50m',
  maxFiles: '365d', // 1 an pour l'audit
  level: 'audit',
  format: logFormat
})

// Transport console pour le développement
const consoleTransport = new winston.transports.Console({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
})

// Configuration du logger principal
const logger = winston.createLogger({
  levels: customLevels.levels,
  format: logFormat,
  defaultMeta: {
    service: 'microfinance-app',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    errorTransport,
    combinedTransport,
    auditTransport,
    ...(process.env.NODE_ENV !== 'production' ? [consoleTransport] : [])
  ],
  exitOnError: false
})

winston.addColors(customLevels.colors)

export default logger
```

### **3. Service de logging métier**

**`lib/logging/businessLogger.js`**
```javascript
import logger from './winston.config.js'
import { AsyncLocalStorage } from 'async_hooks'

// Context storage pour tracer les requêtes
const asyncLocalStorage = new AsyncLocalStorage()

class BusinessLogger {
  
  // Initialiser le contexte pour une requête
  static initRequestContext(req, res, next) {
    const requestId = this.generateRequestId()
    const context = {
      requestId,
      userId: req.user?.id || 'anonymous',
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    }
    
    asyncLocalStorage.run(context, () => {
      req.requestId = requestId
      next()
    })
  }

  // Logger pour les actions utilisateur
  static logUserAction(action, userId, data = {}) {
    const context = asyncLocalStorage.getStore() || {}
    
    logger.audit('User action performed', {
      action,
      userId,
      requestId: context.requestId,
      timestamp: new Date().toISOString(),
      data: this.sanitizeData(data)
    })
  }

  // Logger pour les transactions financières
  static logTransaction(operation, data) {
    const context = asyncLocalStorage.getStore() || {}
    
    logger.audit('Financial transaction', {
      operation,
      requestId: context.requestId,
      userId: context.userId,
      timestamp: new Date().toISOString(),
      transaction: {
        id: data.id,
        type: data.type,
        clientId: data.clientId,
        // Montant masqué pour la sécurité
        montant: data.montant ? '[FILTERED]' : undefined,
        sourceDestination: data.sourceDestination
      }
    })
  }

  // Logger pour les erreurs avec contexte
  static logError(error, additionalContext = {}) {
    const context = asyncLocalStorage.getStore() || {}
    
    logger.error('Application error', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      requestId: context.requestId,
      userId: context.userId,
      context: additionalContext,
      timestamp: new Date().toISOString()
    })
  }

  // Logger pour les accès aux données sensibles
  static logDataAccess(resource, action, userId, additionalData = {}) {
    const context = asyncLocalStorage.getStore() || {}
    
    logger.audit('Data access', {
      resource,
      action,
      userId,
      requestId: context.requestId,
      timestamp: new Date().toISOString(),
      additionalData: this.sanitizeData(additionalData)
    })
  }

  // Logger pour les métriques de performance
  static logPerformance(operation, duration, additionalMetrics = {}) {
    const context = asyncLocalStorage.getStore() || {}
    
    logger.info('Performance metric', {
      operation,
      duration,
      requestId: context.requestId,
      timestamp: new Date().toISOString(),
      metrics: additionalMetrics
    })
  }

  // Utilitaires
  static generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static sanitizeData(data) {
    const sensitiveFields = ['password', 'token', 'montant', 'solde', 'telephone']
    const sanitized = { ...data }
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[FILTERED]'
      }
    })
    
    return sanitized
  }
}

export default BusinessLogger
```

### **4. Middleware Next.js**

**`middleware.js`**
```javascript
import { NextResponse } from 'next/server'
import BusinessLogger from './lib/logging/businessLogger.js'

export function middleware(request) {
  const start = Date.now()
  
  // Log de la requête entrante
  BusinessLogger.logUserAction('api_request', 'system', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent')
  })

  const response = NextResponse.next()
  
  // Log de la réponse
  const duration = Date.now() - start
  BusinessLogger.logPerformance('api_response', duration, {
    status: response.status,
    method: request.method,
    url: request.url
  })

  return response
}

export const config = {
  matcher: ['/api/:path*']
}
```

### **5. Intégration dans les API routes**

**`app/api/transactions/route.js`**
```javascript
import { NextRequest, NextResponse } from 'next/server'
import BusinessLogger from '@/lib/logging/businessLogger'

export async function POST(request) {
  const userId = 'user123' // À récupérer de la session
  
  try {
    BusinessLogger.logUserAction('create_transaction_attempt', userId)
    
    const data = await request.json()
    
    // Validation et traitement...
    const transaction = await createTransaction(data)
    
    BusinessLogger.logTransaction('created', transaction)
    BusinessLogger.logUserAction('create_transaction_success', userId, {
      transactionId: transaction.id
    })
    
    return NextResponse.json(transaction)
    
  } catch (error) {
    BusinessLogger.logError(error, {
      operation: 'create_transaction',
      userId
    })
    
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    )
  }
}
```

### **6. Monitoring et scripts de surveillance**

**`scripts/log-monitor.js`**
```javascript
import fs from 'fs'
import path from 'path'
import { createTransporter } from '../lib/email/transporter.js'

class LogMonitor {
  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs')
    this.alertThresholds = {
      errorCount: 10, // 10 erreurs en 5 minutes
      timeWindow: 5 * 60 * 1000 // 5 minutes
    }
  }

  async checkErrorRate() {
    const errorLogFile = this.getLatestErrorLog()
    if (!errorLogFile) return

    const errors = this.getRecentErrors(errorLogFile)
    
    if (errors.length >= this.alertThresholds.errorCount) {
      await this.sendAlert(`High error rate detected: ${errors.length} errors in 5 minutes`)
    }
  }

  getLatestErrorLog() {
    const today = new Date().toISOString().split('T')[0]
    const errorLogPath = path.join(this.logsDir, `error-${today}.log`)
    
    return fs.existsSync(errorLogPath) ? errorLogPath : null
  }

  getRecentErrors(logFile) {
    const now = Date.now()
    const timeWindow = now - this.alertThresholds.timeWindow
    
    const logContent = fs.readFileSync(logFile, 'utf8')
    const lines = logContent.split('\n').filter(line => line.trim())
    
    return lines
      .map(line => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter(log => log && new Date(log.timestamp).getTime() > timeWindow)
  }

  async sendAlert(message) {
    console.error(`🚨 ALERT: ${message}`)
    
    // Envoi email optionnel
    if (process.env.ALERT_EMAIL) {
      const transporter = createTransporter()
      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: process.env.ALERT_EMAIL,
        subject: '🚨 Microfinance App - Alert',
        text: message
      })
    }
    
    // Webhook Slack optionnel
    if (process.env.SLACK_WEBHOOK) {
      await fetch(process.env.SLACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `🚨 ${message}` })
      })
    }
  }
}

// Exécution du monitoring
const monitor = new LogMonitor()
monitor.checkErrorRate()
```

**`scripts/log-analyzer.js`**
```javascript
import fs from 'fs'
import path from 'path'

class LogAnalyzer {
  constructor(logsDir = './logs') {
    this.logsDir = logsDir
  }

  // Analyse des métriques quotidiennes
  analyzeDailyMetrics(date) {
    const logFile = path.join(this.logsDir, `combined-${date}.log`)
    if (!fs.existsSync(logFile)) {
      console.log(`No logs found for ${date}`)
      return
    }

    const logs = this.parseLogs(logFile)
    
    const metrics = {
      totalRequests: 0,
      errors: 0,
      transactions: 0,
      uniqueUsers: new Set(),
      averageResponseTime: 0,
      topErrors: {},
      hourlyDistribution: Array(24).fill(0)
    }

    let totalResponseTime = 0
    let responseTimeCount = 0

    logs.forEach(log => {
      // Comptage des requêtes
      if (log.message?.includes('api_request')) {
        metrics.totalRequests++
        const hour = new Date(log.timestamp).getHours()
        metrics.hourlyDistribution[hour]++
      }

      // Comptage des erreurs
      if (log.level === 'error') {
        metrics.errors++
        const errorType = log.error?.name || 'Unknown'
        metrics.topErrors[errorType] = (metrics.topErrors[errorType] || 0) + 1
      }

      // Comptage des transactions
      if (log.message?.includes('Financial transaction')) {
        metrics.transactions++
      }

      // Utilisateurs uniques
      if (log.metadata?.userId && log.metadata.userId !== 'anonymous') {
        metrics.uniqueUsers.add(log.metadata.userId)
      }

      // Temps de réponse
      if (log.metadata?.duration) {
        totalResponseTime += log.metadata.duration
        responseTimeCount++
      }
    })

    metrics.uniqueUsers = metrics.uniqueUsers.size
    metrics.averageResponseTime = responseTimeCount > 0 
      ? Math.round(totalResponseTime / responseTimeCount) 
      : 0

    this.generateReport(date, metrics)
  }

  parseLogs(logFile) {
    const content = fs.readFileSync(logFile, 'utf8')
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter(Boolean)
  }

  generateReport(date, metrics) {
    console.log(`\n📊 Rapport d'activité - ${date}`)
    console.log('=' .repeat(50))
    console.log(`📈 Requêtes totales: ${metrics.totalRequests}`)
    console.log(`👥 Utilisateurs uniques: ${metrics.uniqueUsers}`)
    console.log(`💰 Transactions: ${metrics.transactions}`)
    console.log(`⚠️  Erreurs: ${metrics.errors}`)
    console.log(`⚡ Temps de réponse moyen: ${metrics.averageResponseTime}ms`)
    
    if (Object.keys(metrics.topErrors).length > 0) {
      console.log('\n🔥 Top erreurs:')
      Object.entries(metrics.topErrors)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([error, count]) => {
          console.log(`   ${error}: ${count}`)
        })
    }

    console.log('\n🕐 Distribution horaire:')
    metrics.hourlyDistribution.forEach((count, hour) => {
      if (count > 0) {
        console.log(`   ${hour}h: ${'■'.repeat(Math.min(count / 10, 20))} (${count})`)
      }
    })
  }
}

// Utilisation
const analyzer = new LogAnalyzer()
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
const dateStr = yesterday.toISOString().split('T')[0]
analyzer.analyzeDailyMetrics(dateStr)
```

---

## 📊 **Monitoring et alertes**

### **1. Configuration logrotate**

**`/etc/logrotate.d/microfinance-app`**
```bash
/path/to/your/app/logs/*.log {
    daily
    missingok
    rotate 90
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        # Redémarrer l'app si nécessaire
        systemctl reload microfinance-app
    endscript
}
```

### **2. Cron jobs pour monitoring**

**`crontab -e`**
```bash
# Monitoring des erreurs toutes les 5 minutes
*/5 * * * * /usr/bin/node /path/to/app/scripts/log-monitor.js

# Rapport quotidien à 6h du matin
0 6 * * * /usr/bin/node /path/to/app/scripts/log-analyzer.js

# Nettoyage des logs anciens (> 90 jours)
0 2 * * 0 find /path/to/app/logs -name "*.log" -mtime +90 -delete
```

### **3. Dashboard simple avec HTML**

**`scripts/generate-dashboard.js`**
```javascript
import fs from 'fs'
import path from 'path'

class SimpleDashboard {
  generateHTML(metrics) {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Microfinance App - Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .metric-label { font-size: 0.9em; color: #666; }
        .error { color: #dc2626; }
        .success { color: #16a34a; }
        .chart-bar { height: 20px; background: #e5e7eb; margin: 5px 0; border-radius: 10px; overflow: hidden; }
        .chart-fill { height: 100%; background: #3b82f6; transition: width 0.3s; }
    </style>
    <script>
        setTimeout(() => window.location.reload(), 300000); // Refresh toutes les 5 minutes
    </script>
</head>
<body>
    <div class="container">
        <h1>📊 Dashboard Microfinance App</h1>
        <p>Dernière mise à jour: ${new Date().toLocaleString('fr-FR')}</p>
        
        <div class="card">
            <h2>📈 Métriques Aujourd'hui</h2>
            <div class="metric">
                <div class="metric-value">${metrics.requests}</div>
                <div class="metric-label">Requêtes</div>
            </div>
            <div class="metric">
                <div class="metric-value success">${metrics.transactions}</div>
                <div class="metric-label">Transactions</div>
            </div>
            <div class="metric">
                <div class="metric-value ${metrics.errors > 0 ? 'error' : 'success'}">${metrics.errors}</div>
                <div class="metric-label">Erreurs</div>
            </div>
            <div class="metric">
                <div class="metric-value">${metrics.users}</div>
                <div class="metric-label">Utilisateurs actifs</div>
            </div>
        </div>
        
        <div class="card">
            <h2>🕐 Activité par heure</h2>
            ${metrics.hourlyActivity.map((count, hour) => `
                <div style="display: flex; align-items: center; margin: 5px 0;">
                    <span style="width: 30px; font-size: 0.9em;">${hour}h</span>
                    <div class="chart-bar" style="width: 200px;">
                        <div class="chart-fill" style="width: ${(count / Math.max(...metrics.hourlyActivity)) * 100}%"></div>
                    </div>
                    <span style="margin-left: 10px; font-size: 0.9em;">${count}</span>
                </div>
            `).join('')}
        </div>
        
        ${metrics.recentErrors.length > 0 ? `
        <div class="card">
            <h2>⚠️ Erreurs Récentes</h2>
            ${metrics.recentErrors.slice(0, 10).map(error => `
                <div style="border-left: 3px solid #dc2626; padding-left: 10px; margin: 10px 0;">
                    <strong>${error.timestamp}</strong><br>
                    <span style="color: #dc2626;">${error.message}</span>
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>
    `
  }

  async generateAndSave() {
    // Analyser les logs du jour
    const today = new Date().toISOString().split('T')[0]
    const metrics = await this.analyzeToday(today)
    
    // Générer le HTML
    const html = this.generateHTML(metrics)
    
    // Sauvegarder
    const dashboardPath = path.join(process.cwd(), 'logs', 'dashboard.html')
    fs.writeFileSync(dashboardPath, html)
    
    console.log(`Dashboard généré: ${dashboardPath}`)
  }
}
```

---

## 📚 **Bonnes pratiques**

### **1. Structure des logs optimale**

```javascript
// Format standardisé pour tous les logs
const logEntry = {
  timestamp: '2025-01-29T10:30:45.123Z',
  level: 'info',
  message: 'User action performed',
  service: 'microfinance-app',
  requestId: 'req_1643453445123_abc123',
  userId: 'user_456',
  operation: 'create_transaction',
  metadata: {
    transactionId: 'tx_789',
    amount: '[FILTERED]',
    clientId: 'client_321'
  },
  performance: {
    duration: 245,
    memory: 67108864
  }
}
```

### **2. Gestion des niveaux de log**

```javascript
// Environnement de développement
if (process.env.NODE_ENV === 'development') {
  logger.level = 'debug'
}

// Production
if (process.env.NODE_ENV === 'production') {
  logger.level = 'info'
}

// Logs par niveau
logger.error('Erreur critique')      // Toujours loggé
logger.warn('Avertissement')         // Important
logger.audit('Action utilisateur')   // Audit trail
logger.info('Information générale')  // Normal
logger.debug('Debug développement')  // Dev seulement
```

### **3. Optimisation des performances**

```javascript
// Logging asynchrone pour éviter les blocages
const asyncLogger = winston.createLogger({
  transports: [
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      // Buffer les logs pour l'écriture par batch
      options: { 
        flags: 'a',
        highWaterMark: 16 * 1024 // 16KB buffer
      }
    })
  ]
})

// Mise en cache des formats coûteux
const formatCache = new Map()

const cachedFormat = winston.format((info) => {
  const key = `${info.level}_${info.message}`
  if (!formatCache.has(key)) {
    formatCache.set(key, JSON.stringify(info))
  }
  return formatCache.get(key)
})
```

---

## 🔧 **Maintenance et évolution**

### **1. Scripts de maintenance**

**`scripts/maintenance.js`**
```javascript
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { execSync } from 'child_process'

class LogMaintenance {
  constructor(logsDir = './logs') {
    this.logsDir = logsDir
  }

  // Archivage des anciens logs
  async archiveOldLogs(daysOld = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    const files = fs.readdirSync(this.logsDir)
    const oldFiles = files.filter(file => {
      const filePath = path.join(this.logsDir, file)
      const stats = fs.statSync(filePath)
      return stats.mtime < cutoffDate && file.endsWith('.log')
    })

    for (const file of oldFiles) {
      const filePath = path.join(this.logsDir, file)
      const archivePath = path.join(this.logsDir, 'archive', file + '.gz')
      
      // Créer le dossier archive si nécessaire
      fs.mkdirSync(path.dirname(archivePath), { recursive: true })
      
      // Compresser et déplacer
      execSync(`gzip -c "${filePath}" > "${archivePath}"`)
      fs.unlinkSync(filePath)
      
      console.log(`Archived: ${file}`)
    }
  }

  // Vérification de l'intégrité des logs
  async validateLogIntegrity() {
    const files = fs.readdirSync(this.logsDir)
    const logFiles = files.filter(f => f.endsWith('.log'))
    
    const results = {
      total: logFiles.length,
      valid: 0,
      corrupted: [],
      empty: []
    }

    for (const file of logFiles) {
      const filePath = path.join(this.logsDir, file)
      const content = fs.readFileSync(filePath, 'utf8')
      
      if (content.trim() === '') {
        results.empty.push(file)
        continue
      }

      const lines = content.split('\n').filter(l => l.trim())
      let validLines = 0
      
      for (const line of lines) {
        try {
          JSON.parse(line)
          validLines++
        } catch (e) {
          // Ligne corrompue
        }
      }

      if (validLines === lines.length) {
        results.valid++
      } else {
        results.corrupted.push({
          file,
          totalLines: lines.length,
          validLines,
          corruptedLines: lines.length - validLines
        })
      }
    }

    console.log('📋 Rapport d\'intégrité des logs:')
    console.log(`   Fichiers vérifiés: ${results.total}`)
    console.log(`   Fichiers valides: ${results.valid}`)
    console.log(`   Fichiers vides: ${results.empty.length}`)
    console.log(`   Fichiers corrompus: ${results.corrupted.length}`)

    if (results.corrupted.length > 0) {
      console.log('\n⚠️  Fichiers corrompus détectés:')
      results.corrupted.forEach(item => {
        console.log(`   ${item.file}: ${item.corruptedLines} lignes corrompues sur ${item.totalLines}`)
      })
    }

    return results
  }

  // Statistiques d'utilisation du disque
  async getDiskUsage() {
    const files = fs.readdirSync(this.logsDir)
    let totalSize = 0
    const fileSizes = {}

    for (const file of files) {
      const filePath = path.join(this.logsDir, file)
      const stats = fs.statSync(filePath)
      if (stats.isFile()) {
        fileSizes[file] = stats.size
        totalSize += stats.size
      }
    }

    const formatSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    console.log('💾 Utilisation disque des logs:')
    console.log(`   Taille totale: ${formatSize(totalSize)}`)
    console.log('   Top 10 fichiers:')
    
    Object.entries(fileSizes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([file, size]) => {
        console.log(`   ${file}: ${formatSize(size)}`)
      })
  }
}

// Exécution de la maintenance
const maintenance = new LogMaintenance()
maintenance.validateLogIntegrity()
maintenance.getDiskUsage()
maintenance.archiveOldLogs(30)
```

### **2. Configuration de surveillance système**

**`scripts/system-monitor.js`**
```javascript
import fs from 'fs'
import os from 'os'
import BusinessLogger from '../lib/logging/businessLogger.js'

class SystemMonitor {
  constructor() {
    this.thresholds = {
      diskUsage: 80,    // %
      memoryUsage: 85,  // %
      cpuUsage: 90,     // %
      logFileSize: 100  // MB
    }
  }

  async checkSystemHealth() {
    const metrics = {
      disk: this.getDiskUsage(),
      memory: this.getMemoryUsage(),
      cpu: await this.getCpuUsage(),
      logs: this.getLogMetrics()
    }

    // Vérifier les seuils et alerter si nécessaire
    this.checkThresholds(metrics)
    
    // Logger les métriques système
    BusinessLogger.logInfo('System health check', { metrics })

    return metrics
  }

  getDiskUsage() {
    const stats = fs.statSync(process.cwd())
    const free = fs.statSync('.').free
    const total = fs.statSync('.').size
    return {
      used: ((total - free) / total) * 100,
      free: free,
      total: total
    }
  }

  getMemoryUsage() {
    const total = os.totalmem()
    const free = os.freemem()
    const used = total - free
    return {
      used: (used / total) * 100,
      free: free,
      total: total
    }
  }

  async getCpuUsage() {
    const cpus = os.cpus()
    const usage = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0)
      const idle = cpu.times.idle
      return ((total - idle) / total) * 100
    })
    return usage.reduce((acc, val) => acc + val, 0) / usage.length
  }

  getLogMetrics() {
    const logsDir = './logs'
    if (!fs.existsSync(logsDir)) return { totalSize: 0, fileCount: 0 }

    const files = fs.readdirSync(logsDir)
    let totalSize = 0
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file)
      const stats = fs.statSync(filePath)
      if (stats.isFile()) totalSize += stats.size
    })

    return {
      totalSize: totalSize / (1024 * 1024), // MB
      fileCount: files.length
    }
  }

  checkThresholds(metrics) {
    const alerts = []

    if (metrics.disk.used > this.thresholds.diskUsage) {
      alerts.push(`High disk usage: ${metrics.disk.used.toFixed(1)}%`)
    }

    if (metrics.memory.used > this.thresholds.memoryUsage) {
      alerts.push(`High memory usage: ${metrics.memory.used.toFixed(1)}%`)
    }

    if (metrics.cpu > this.thresholds.cpuUsage) {
      alerts.push(`High CPU usage: ${metrics.cpu.toFixed(1)}%`)
    }

    if (metrics.logs.totalSize > this.thresholds.logFileSize) {
      alerts.push(`Large log files: ${metrics.logs.totalSize.toFixed(1)}MB`)
    }

    if (alerts.length > 0) {
      const message = `System alerts:\n${alerts.join('\n')}`
      BusinessLogger.logError(new Error('System threshold exceeded'), { alerts })
      
      // Envoyer notifications si configuré
      this.sendSystemAlert(message)
    }
  }

  async sendSystemAlert(message) {
    console.error(`🚨 SYSTEM ALERT: ${message}`)
    
    // Implémentation des notifications (email, Slack, etc.)
    // Similaire au LogMonitor
  }
}
```

---

## 📈 **ROI et bénéfices attendus**

### **Avantages financiers**
- **Coût zéro** d'infrastructure externe
- **Pas de limites** de volume de logs
- **Contrôle total** des coûts de stockage
- **Pas d'abonnement** mensuel

### **Avantages techniques**
- **Performance maximale** (pas de latence réseau)
- **Disponibilité 100%** (pas de dépendance externe)
- **Sécurité renforcée** (données locales)
- **Customisation illimitée**

### **Avantages opérationnels**
- **Conformité RGPD** simplifiée
- **Audit trail complet** 
- **Debugging efficace** avec contexte riche
- **Métriques business** personnalisées

---

## 🎯 **Conclusion et recommandations**

### **Winston est recommandé si :**
- ✅ Budget serré (solution gratuite)
- ✅ Données sensibles (contrôle total)
- ✅ Besoins de personnalisation élevés
- ✅ Infrastructure maîtrisée
- ✅ Équipe technique autonome

### **Phases d'implémentation recommandées :**
1. **Semaine 1** : Setup de base et logging essentiel
2. **Semaine 2** : Fonctionnalités avancées et monitoring
3. **Semaine 3** : Optimisation et automation

### **Prochaines étapes :**
1. Installation des packages Winston
2. Configuration des transports de logging
3. Implémentation du middleware
4. Tests et validation
5. Mise en production

### **Maintenance continue :**
- Surveillance quotidienne des métriques
- Archivage mensuel des anciens logs
- Validation hebdomadaire de l'intégrité
- Optimisation trimestrielle

---

## 🔗 **Ressources supplémentaires**

### **Documentation officielle**
- [Winston GitHub](https://github.com/winstonjs/winston)
- [Daily Rotate File](https://github.com/winstonjs/winston-daily-rotate-file)
- [Express Winston](https://github.com/bithavoc/express-winston)

### **Outils complémentaires**
- **ELK Stack** : Pour analysis avancée (optionnel)
- **Grafana** : Pour dashboards visuels (optionnel)
- **Logrotate** : Pour rotation automatique
- **PM2** : Pour monitoring de l'application

---

*Document créé le : 29 janvier 2025*  
*Dernière mise à jour : 29 janvier 2025*  
*Version : 1.0*