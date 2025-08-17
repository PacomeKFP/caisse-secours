import { NextRequest, NextResponse } from 'next/server'
import { CaisseLogger } from '@/lib/logging/CaisseLogger'
import { ClientService } from '@/lib/services/clientService'
import fs from 'fs'
import path from 'path'

// Endpoint pour exposer les métriques au format Prometheus
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'prometheus'
    
    if (format === 'prometheus') {
      return await getPrometheusMetrics()
    } else if (format === 'json') {
      return await getJsonMetrics()
    } else {
      return NextResponse.json({ error: 'Format not supported' }, { status: 400 })
    }
  } catch (error) {
    CaisseLogger.logError(error as Error, {
      module: 'metrics',
      operation: 'get_metrics'
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getPrometheusMetrics() {
  try {
    // Récupérer les métriques business actuelles
    const clients = await ClientService.getAllClientsLegacy()
    const totalClients = clients.length
    const totalSolde = clients.reduce((sum, client) => sum + (client.solde || 0), 0)
    const totalDepots = clients.reduce((sum, client) => sum + (client.totalDepots || 0), 0)
    const totalRetraits = clients.reduce((sum, client) => sum + (client.totalRetraits || 0), 0)
    
    // Métriques système
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()
    
    // Format Prometheus
    const metrics = `
# HELP caisse_clients_total Nombre total de clients
# TYPE caisse_clients_total gauge
caisse_clients_total ${totalClients}

# HELP caisse_solde_total_fcfa Solde total de tous les clients en FCFA
# TYPE caisse_solde_total_fcfa gauge
caisse_solde_total_fcfa ${totalSolde}

# HELP caisse_transactions_depot_total_fcfa Total des dépôts en FCFA
# TYPE caisse_transactions_depot_total_fcfa gauge
caisse_transactions_depot_total_fcfa ${totalDepots}

# HELP caisse_transactions_retrait_total_fcfa Total des retraits en FCFA
# TYPE caisse_transactions_retrait_total_fcfa gauge
caisse_transactions_retrait_total_fcfa ${totalRetraits}

# HELP caisse_uptime_seconds Temps d'activité en secondes
# TYPE caisse_uptime_seconds gauge
caisse_uptime_seconds ${uptime}

# HELP caisse_memory_usage_bytes Utilisation mémoire en bytes
# TYPE caisse_memory_usage_bytes gauge
caisse_memory_usage_bytes{type="rss"} ${memoryUsage.rss}
caisse_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}
caisse_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}
caisse_memory_usage_bytes{type="external"} ${memoryUsage.external}

# HELP caisse_version_info Version de l'application
# TYPE caisse_version_info gauge
caisse_version_info{version="${process.env.npm_package_version || '1.0.0'}"} 1
`.trim()

    return new Response(metrics, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    throw error
  }
}

async function getJsonMetrics() {
  try {
    // Récupérer les métriques business
    const clients = await ClientService.getAllClientsLegacy()
    
    // Métriques système
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()
    
    // Métriques de logs (exemple basique)
    const logMetrics = await getLogMetrics()
    
    const metrics = {
      timestamp: new Date().toISOString(),
      service: 'caisse-secours',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      business: {
        total_clients: clients.length,
        total_solde_fcfa: clients.reduce((sum, client) => sum + (client.solde || 0), 0),
        total_depots_fcfa: clients.reduce((sum, client) => sum + (client.totalDepots || 0), 0),
        total_retraits_fcfa: clients.reduce((sum, client) => sum + (client.totalRetraits || 0), 0),
        clients_solde_positif: clients.filter(c => (c.solde || 0) > 0).length,
        clients_solde_negatif: clients.filter(c => (c.solde || 0) < 0).length
      },
      
      system: {
        uptime_seconds: uptime,
        memory_usage_bytes: {
          rss: memoryUsage.rss,
          heap_total: memoryUsage.heapTotal,
          heap_used: memoryUsage.heapUsed,
          external: memoryUsage.external
        },
        cpu_usage_percent: await getCpuUsage()
      },
      
      logs: logMetrics
    }
    
    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    throw error
  }
}

async function getLogMetrics() {
  try {
    const logsDir = path.join(process.cwd(), 'logs')
    
    if (!fs.existsSync(logsDir)) {
      return {
        error: 'Logs directory not found'
      }
    }
    
    const files = fs.readdirSync(logsDir)
    const today = new Date().toISOString().split('T')[0]
    
    let errorCount = 0
    let businessCount = 0
    let auditCount = 0
    
    // Analyser les logs du jour
    files.forEach(file => {
      if (file.includes(today)) {
        const filePath = path.join(logsDir, file)
        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n').filter(line => line.trim())
        
        if (file.startsWith('error-')) {
          errorCount += lines.length
        } else if (file.startsWith('business-')) {
          businessCount += lines.length
        } else if (file.startsWith('audit-')) {
          auditCount += lines.length
        }
      }
    })
    
    return {
      today: {
        error_count: errorCount,
        business_events_count: businessCount,
        audit_events_count: auditCount
      },
      log_files_count: files.length
    }
  } catch (error) {
    return {
      error: 'Unable to read log metrics'
    }
  }
}

async function getCpuUsage() {
  return new Promise<number>((resolve) => {
    const start = process.cpuUsage()
    setTimeout(() => {
      const usage = process.cpuUsage(start)
      const totalUsage = (usage.user + usage.system) / 1000000 // Convert to seconds
      resolve(Math.round(totalUsage * 100) / 100)
    }, 100)
  })
}