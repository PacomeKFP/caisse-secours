import logger from './winston.config'
import { AsyncLocalStorage } from 'async_hooks'

// Context storage pour tracer les requêtes
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()

interface RequestContext {
  requestId: string
  userId?: string
  userAgent?: string
  ip?: string
  method?: string
  url?: string
  startTime: number
}

interface BusinessMetrics {
  totalClients?: number
  totalTransactions?: number
  totalAmount?: number
  activeUsers?: number
}

interface PerformanceMetrics {
  duration: number
  memoryUsed?: number
  cpuUsage?: number
  dbQueries?: number
}

export class CaisseLogger {
  
  // ======================
  // CONTEXT MANAGEMENT
  // ======================
  
  static initRequestContext(req: any, res: any, next: any) {
    const requestId = this.generateRequestId()
    const context: RequestContext = {
      requestId,
      userId: req.user?.id || 'anonymous',
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      method: req.method,
      url: req.url,
      startTime: Date.now()
    }
    
    asyncLocalStorage.run(context, () => {
      req.requestId = requestId
      next()
    })
  }

  static getContext(): RequestContext | undefined {
    return asyncLocalStorage.getStore()
  }

  // ======================
  // BUSINESS LOGGING
  // ======================

  static logClientAction(action: string, clientId: string, data: any = {}) {
    const context = this.getContext()
    
    logger.business('Client action performed', {
      module: 'clients',
      operation: action,
      client_id: clientId,
      request_id: context?.requestId,
      user_id: context?.userId,
      timestamp: new Date().toISOString(),
      data: this.sanitizeData(data),
      labels: {
        module: 'clients',
        action: action,
        client_id: clientId
      }
    })

    // Métrique pour Prometheus
    this.recordMetric('client_action_total', 1, {
      action: action,
      module: 'clients'
    })
  }

  static logTransaction(operation: string, transactionData: any) {
    const context = this.getContext()
    
    logger.business('Transaction processed', {
      module: 'transactions',
      operation: operation,
      transaction_id: transactionData.id,
      transaction_type: transactionData.type,
      client_id: transactionData.clientId,
      request_id: context?.requestId,
      user_id: context?.userId,
      timestamp: new Date().toISOString(),
      // Montant masqué pour sécurité mais présent pour analytics
      amount_masked: transactionData.montant ? '[AMOUNT]' : undefined,
      source_destination: transactionData.sourceDestination,
      labels: {
        module: 'transactions',
        operation: operation,
        transaction_type: transactionData.type
      }
    })

    // Métriques business
    this.recordMetric('transaction_total', 1, {
      type: transactionData.type,
      operation: operation
    })
    
    this.recordMetric('transaction_amount', transactionData.montant || 0, {
      type: transactionData.type,
      currency: 'FCFA'
    })
  }

  static logCommissionAction(action: string, data: any = {}) {
    const context = this.getContext()
    
    logger.business('Commission action performed', {
      module: 'commissions',
      operation: action,
      request_id: context?.requestId,
      user_id: context?.userId,
      timestamp: new Date().toISOString(),
      commission_period: data.moisAnnee,
      commission_count: data.count,
      total_amount_masked: data.totalAmount ? '[AMOUNT]' : undefined,
      labels: {
        module: 'commissions',
        action: action,
        period: data.moisAnnee
      }
    })

    this.recordMetric('commission_action_total', 1, {
      action: action,
      period: data.moisAnnee || 'unknown'
    })
  }

  // ======================
  // TECHNICAL LOGGING
  // ======================

  static logError(error: Error, context: any = {}) {
    const requestContext = this.getContext()
    
    logger.error('Application error occurred', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      module: context.module || 'unknown',
      operation: context.operation || 'unknown',
      request_id: requestContext?.requestId,
      user_id: requestContext?.userId,
      timestamp: new Date().toISOString(),
      context: this.sanitizeData(context),
      labels: {
        error_type: error.name,
        module: context.module || 'unknown'
      }
    })

    this.recordMetric('error_total', 1, {
      error_type: error.name,
      module: context.module || 'unknown'
    })
  }

  static logApiRequest(method: string, url: string, statusCode: number, duration: number) {
    const context = this.getContext()
    
    logger.info('API request processed', {
      module: 'api',
      operation: 'request',
      http_method: method,
      http_url: url,
      http_status: statusCode,
      duration_ms: duration,
      request_id: context?.requestId,
      user_id: context?.userId,
      timestamp: new Date().toISOString(),
      labels: {
        method: method,
        status: statusCode.toString(),
        endpoint: this.extractEndpoint(url)
      }
    })

    // Métriques HTTP
    this.recordMetric('http_requests_total', 1, {
      method: method,
      status: statusCode.toString(),
      endpoint: this.extractEndpoint(url)
    })

    this.recordMetric('http_request_duration_ms', duration, {
      method: method,
      endpoint: this.extractEndpoint(url)
    })
  }

  // ======================
  // AUDIT LOGGING
  // ======================

  static logUserAction(userId: string, action: string, resource: string, details: any = {}) {
    const context = this.getContext()
    
    logger.audit('User action audit', {
      audit_type: 'user_action',
      user_id: userId,
      action: action,
      resource: resource,
      request_id: context?.requestId,
      timestamp: new Date().toISOString(),
      ip_address: context?.ip,
      user_agent: context?.userAgent,
      details: this.sanitizeData(details),
      labels: {
        audit_type: 'user_action',
        action: action,
        resource: resource
      }
    })
  }

  static logDataAccess(userId: string, resource: string, action: string, recordIds: string[] = []) {
    const context = this.getContext()
    
    logger.audit('Data access audit', {
      audit_type: 'data_access',
      user_id: userId,
      resource: resource,
      action: action,
      record_count: recordIds.length,
      record_ids: recordIds.slice(0, 10), // Limite pour éviter logs trop gros
      request_id: context?.requestId,
      timestamp: new Date().toISOString(),
      ip_address: context?.ip,
      labels: {
        audit_type: 'data_access',
        resource: resource,
        action: action
      }
    })
  }

  // ======================
  // PERFORMANCE LOGGING
  // ======================

  static logPerformance(operation: string, metrics: PerformanceMetrics, module: string = 'unknown') {
    const context = this.getContext()
    
    logger.info('Performance metric', {
      module: module,
      operation: operation,
      duration_ms: metrics.duration,
      memory_used_mb: metrics.memoryUsed ? Math.round(metrics.memoryUsed / 1024 / 1024) : undefined,
      cpu_usage_percent: metrics.cpuUsage,
      db_queries_count: metrics.dbQueries,
      request_id: context?.requestId,
      timestamp: new Date().toISOString(),
      labels: {
        module: module,
        operation: operation
      }
    })

    // Métriques de performance
    this.recordMetric('operation_duration_ms', metrics.duration, {
      module: module,
      operation: operation
    })

    if (metrics.memoryUsed) {
      this.recordMetric('memory_usage_bytes', metrics.memoryUsed, {
        module: module
      })
    }
  }

  // ======================
  // BUSINESS METRICS
  // ======================

  static logBusinessMetrics(metrics: BusinessMetrics) {
    logger.business('Business metrics snapshot', {
      module: 'metrics',
      operation: 'snapshot',
      total_clients: metrics.totalClients,
      total_transactions: metrics.totalTransactions,
      total_amount_masked: metrics.totalAmount ? '[AMOUNT]' : undefined,
      active_users: metrics.activeUsers,
      timestamp: new Date().toISOString(),
      labels: {
        type: 'business_snapshot'
      }
    })

    // Métriques business pour monitoring
    if (metrics.totalClients !== undefined) {
      this.recordMetric('total_clients', metrics.totalClients, {})
    }
    if (metrics.totalTransactions !== undefined) {
      this.recordMetric('total_transactions', metrics.totalTransactions, {})
    }
    if (metrics.activeUsers !== undefined) {
      this.recordMetric('active_users', metrics.activeUsers, {})
    }
  }

  // ======================
  // METRICS FOR PROMETHEUS
  // ======================

  private static recordMetric(name: string, value: number, labels: Record<string, string>) {
    logger.log({
      level: 'info',
      message: `Metric recorded: ${name}`,
      metric_type: 'counter',
      metric_name: name,
      value: value,
      labels: labels,
      timestamp: new Date().toISOString()
    })
  }

  // ======================
  // UTILITIES
  // ======================

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data

    const sensitiveFields = ['password', 'token', 'montant', 'solde', 'telephone', 'commission']
    const sanitized = { ...data }
    
    sensitiveFields.forEach(field => {
      if (sanitized[field] !== undefined) {
        sanitized[field] = '[FILTERED]'
      }
    })
    
    return sanitized
  }

  private static extractEndpoint(url: string): string {
    // Extraire l'endpoint principal pour grouping des métriques
    return url.replace(/\/[0-9a-f-]{36}|\?.*$/g, '/:id').split('?')[0]
  }

  // ======================
  // DASHBOARD HELPERS
  // ======================

  static async getRecentLogs(level: string = 'info', limit: number = 100) {
    // Cette méthode pourrait lire les logs récents pour un dashboard simple
    // Pour l'instant, elle retourne une structure pour développement futur
    return {
      level,
      limit,
      message: 'Log reading functionality to be implemented for dashboard'
    }
  }

  static async getMetricsSummary() {
    // Résumé des métriques pour dashboard interne
    // Note: process.uptime() et process.memoryUsage() ne sont pas disponibles dans Edge Runtime
    return {
      timestamp: new Date().toISOString(),
      uptime: typeof process !== 'undefined' && process.uptime ? process.uptime() : 0,
      memory: typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage() : { rss: 0, heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0 },
      version: process.env.npm_package_version || '1.0.0'
    }
  }
}

export default CaisseLogger