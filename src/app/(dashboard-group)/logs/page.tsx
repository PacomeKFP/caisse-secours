'use client'

import { useState, useEffect } from 'react'
import { Activity, AlertTriangle, BarChart3, Eye, RefreshCw, Calendar, Clock, Users, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface LogDashboardData {
  date: string
  timestamp: string
  logs: {
    errors: { count: number; latest: any[] }
    business: { count: number; latest: any[] }
    audit: { count: number; latest: any[] }
    combined: { count: number }
  }
  metrics: {
    top_operations: Record<string, number>
    top_modules: Record<string, number>
    top_users: Record<string, number>
    hourly_distribution: number[]
  }
}

interface SystemMetrics {
  business: {
    total_clients: number
    total_solde_fcfa: number
    total_depots_fcfa: number
    total_retraits_fcfa: number
  }
  system: {
    uptime_seconds: number
    memory_usage_bytes: {
      heap_used: number
      heap_total: number
    }
  }
}

export default function LogsPage() {
  const [dashboardData, setDashboardData] = useState<LogDashboardData | null>(null)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [activeTab, setActiveTab] = useState<'overview' | 'errors' | 'business' | 'audit'>('overview')
  const [detailedLogs, setDetailedLogs] = useState<any[]>([])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Récupérer le résumé des logs
      const dashboardResponse = await fetch(`/api/logs/dashboard?type=summary&date=${selectedDate}`)
      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json()
        setDashboardData(data)
      }

      // Récupérer les métriques système
      const metricsResponse = await fetch('/api/metrics?format=json')
      if (metricsResponse.ok) {
        const metrics = await metricsResponse.json()
        setSystemMetrics(metrics)
      }

    } catch (error) {
      toast.error('Erreur lors du chargement du dashboard')
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDetailedLogs = async (type: string) => {
    try {
      const response = await fetch(`/api/logs/dashboard?type=${type}&date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setDetailedLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Detailed logs fetch error:', error)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [selectedDate])

  useEffect(() => {
    if (activeTab !== 'overview') {
      fetchDetailedLogs(activeTab)
    }
  }, [activeTab, selectedDate])

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA'
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}j ${hours}h ${minutes}m`
  }

  const formatMemory = (bytes: number) => {
    return Math.round(bytes / 1024 / 1024) + ' MB'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Logs & Monitoring</h1>
          <p className="text-gray-600">Surveillance en temps réel et analyse des logs système</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>
      </div>

      {/* System Metrics Cards */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Clients Actifs</p>
                <p className="text-2xl font-bold text-blue-600">{systemMetrics.business.total_clients}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Solde Total</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(systemMetrics.business.total_solde_fcfa)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Uptime</p>
                <p className="text-lg font-bold text-purple-600">{formatUptime(systemMetrics.system.uptime_seconds)}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Mémoire</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatMemory(systemMetrics.system.memory_usage_bytes.heap_used)}
                </p>
              </div>
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Logs Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border-2 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Erreurs</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData.logs.errors.count}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Événements Business</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardData.logs.business.count}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Audit Trail</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardData.logs.audit.count}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Logs</p>
                <p className="text-2xl font-bold text-gray-600">{dashboardData.logs.combined.count}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { key: 'errors', label: 'Erreurs', icon: AlertTriangle },
              { key: 'business', label: 'Business', icon: Activity },
              { key: 'audit', label: 'Audit', icon: Eye }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-gold-500 text-gold-600 bg-gold-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && dashboardData && (
            <div className="space-y-6">
              {/* Top Operations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Opérations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(dashboardData.metrics.top_operations)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 6)
                    .map(([operation, count]) => (
                    <div key={operation} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">{operation}</span>
                        <span className="text-gold-600 font-bold">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hourly Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution Horaire</h3>
                <div className="flex items-end gap-1 h-32">
                  {dashboardData.metrics.hourly_distribution.map((count, hour) => (
                    <div key={hour} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gold-400 rounded-t"
                        style={{ 
                          height: `${Math.max(4, (count / Math.max(...dashboardData.metrics.hourly_distribution)) * 100)}px` 
                        }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">{hour}h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'overview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Logs {activeTab} du {selectedDate}
              </h3>
              
              {detailedLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun log {activeTab} pour cette date
                </div>
              ) : (
                <div className="space-y-2">
                  {detailedLogs.map((log, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-mono text-gray-600">
                          {log['@timestamp'] || log.timestamp}
                        </span>
                        {log.level && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            log.level === 'error' ? 'bg-red-100 text-red-800' :
                            log.level === 'business' ? 'bg-blue-100 text-blue-800' :
                            log.level === 'audit' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.level}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-900 mb-2">{log.message}</p>
                      
                      {(log.module || log.operation) && (
                        <div className="flex gap-4 text-sm text-gray-600">
                          {log.module && <span>Module: {log.module}</span>}
                          {log.operation && <span>Opération: {log.operation}</span>}
                        </div>
                      )}
                      
                      {log.error_message && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-red-800 text-sm">{log.error_message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}