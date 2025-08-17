import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

// Niveaux personnalisés pour l'application microfinance
const customLevels = {
  levels: {
    error: 0,      // Erreurs critiques
    warn: 1,       // Avertissements
    business: 2,   // Événements métier importants
    audit: 3,      // Actions utilisateur à auditer
    info: 4,       // Informations générales
    debug: 5       // Debug développement
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    business: 'cyan',
    audit: 'magenta',
    info: 'blue',
    debug: 'green'
  }
}

// Format standardisé pour compatibilité monitoring
const microfinanceFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Structure standardisée pour parsing facile par outils externes
    const logEntry = {
      '@timestamp': timestamp,
      level: level,
      service: 'caisse-secours',
      environment: process.env.NODE_ENV || 'development',
      message: message,
      ...meta
    }
    
    // Ajout de labels Prometheus-compatible si présents
    if (meta.operation) {
      logEntry.operation = meta.operation
    }
    if (meta.module) {
      logEntry.module = meta.module
    }
    if (meta.userId) {
      logEntry.user_id = meta.userId
    }
    if (meta.duration) {
      logEntry.duration_ms = meta.duration
    }
    
    return JSON.stringify(logEntry)
  })
)

// Transport pour les erreurs (surveillance critique)
const errorTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '90d',
  level: 'error',
  format: microfinanceFormat
})

// Transport pour les événements business (pour analytics)
const businessTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'business-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '50m',
  maxFiles: '365d', // 1 an pour les données business
  level: 'business',
  format: microfinanceFormat
})

// Transport pour l'audit trail (conformité)
const auditTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '100m',
  maxFiles: '2555d', // 7 ans pour audit légal
  level: 'audit',
  format: microfinanceFormat
})

// Transport combiné pour monitoring général
const combinedTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '50m',
  maxFiles: '30d',
  format: microfinanceFormat
})

// Transport console pour développement
const consoleTransport = new winston.transports.Console({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, module, operation }) => {
      const prefix = module && operation ? `[${module}:${operation}]` : ''
      return `${timestamp} ${level}: ${prefix} ${message}`
    })
  )
})

// Transport pour métriques (compatible Prometheus)
const metricsTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'metrics-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '7d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      // Format spécial pour métriques (key=value pairs)
      if (meta.metric_type) {
        const labels = Object.entries(meta.labels || {})
          .map(([k, v]) => `${k}="${v}"`)
          .join(',')
        
        return `${meta.metric_name}{${labels}} ${meta.value} ${new Date(timestamp).getTime()}`
      }
      return JSON.stringify({ timestamp, level, message, ...meta })
    })
  )
})

// Configuration du logger principal
const logger = winston.createLogger({
  levels: customLevels.levels,
  format: microfinanceFormat,
  defaultMeta: {
    service: 'caisse-secours',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    instance: process.env.INSTANCE_ID || 'local'
  },
  transports: [
    errorTransport,
    businessTransport,
    auditTransport,
    combinedTransport,
    metricsTransport,
    ...(process.env.NODE_ENV !== 'production' ? [consoleTransport] : [])
  ],
  exitOnError: false
})

// Ajout des couleurs personnalisées
winston.addColors(customLevels.colors)

// Création du dossier logs si inexistant
import fs from 'fs'
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

export default logger