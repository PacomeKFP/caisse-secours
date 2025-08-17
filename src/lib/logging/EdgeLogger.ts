// Logger compatible Edge Runtime pour middleware Next.js
// Pas de winston, pas d'APIs Node.js

interface LogEntry {
  timestamp: string
  level: string
  message: string
  module?: string
  operation?: string
  userId?: string
  requestId?: string
  duration?: number
  method?: string
  pathname?: string
  status?: number
  ip?: string
  userAgent?: string
  [key: string]: any
}

export class EdgeLogger {
  
  private static formatLog(entry: LogEntry): string {
    return JSON.stringify({
      '@timestamp': entry.timestamp,
      level: entry.level,
      service: 'caisse-secours',
      environment: process.env.NODE_ENV || 'development',
      ...entry
    })
  }

  private static log(level: string, message: string, meta: any = {}) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    }

    // En Edge Runtime, on peut seulement utiliser console
    console.log(this.formatLog(entry))
  }

  static info(message: string, meta: any = {}) {
    this.log('info', message, meta)
  }

  static error(message: string, meta: any = {}) {
    this.log('error', message, meta)
  }

  static warn(message: string, meta: any = {}) {
    this.log('warn', message, meta)
  }

  static audit(message: string, meta: any = {}) {
    this.log('audit', message, meta)
  }

  // Méthodes spécifiques pour le middleware
  static logApiRequest(method: string, pathname: string, status: number, duration: number, meta: any = {}) {
    this.info('API request processed', {
      module: 'api',
      operation: 'request',
      method,
      pathname,
      status,
      duration,
      ...meta
    })
  }

  static logUserAction(userId: string, action: string, resource: string, meta: any = {}) {
    this.audit('User action audit', {
      userId,
      action,
      resource,
      ...meta
    })
  }

  static logError(error: Error, meta: any = {}) {
    this.error('Application error occurred', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      ...meta
    })
  }
}