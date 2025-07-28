'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardData {
  stats: {
    totalClients: number
    nouveauxClients: number
    depotsMonth: number
    retraitsMonth: number
    commissionsLastMonth: number
    soldeTotal: number
  }
  recentTransactions: {
    id: string
    type: 'depot' | 'retrait'
    montant: number
    clientNom: string
    clientMatricule: string
    createdAt: string
  }[]
  topClients: {
    id: string
    nom: string
    matricule: string
    solde: number
  }[]
  evolution: {
    date: string
    depots: number
    retraits: number
  }[]
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatEvolutionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Erreur lors du chargement des données</p>
      </div>
    )
  }

  const { stats, recentTransactions, topClients, evolution } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tableau de Bord</h1>
        <p className="text-gray-600">Vue d&apos;ensemble de Caisse Secours</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nouveaux clients ce mois</p>
              <p className="text-2xl font-bold text-gray-900">{stats.nouveauxClients}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Solde total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.soldeTotal)}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dépôts ce mois</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.depotsMonth)}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Retraits ce mois</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.retraitsMonth)}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Commissions mois dernier</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.commissionsLastMonth)}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Dernières Transactions</h2>
            <Link href="/transactions" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Voir tout →
            </Link>
          </div>
          <div className="p-6">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-2">Aucune transaction récente</p>
                <Link href="/transactions" className="text-blue-600 hover:text-blue-700 text-sm">
                  Enregistrer une transaction
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'depot' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <svg className={`w-4 h-4 ${
                          transaction.type === 'depot' ? 'text-green-600' : 'text-red-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d={transaction.type === 'depot' ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{transaction.clientNom}</div>
                        <div className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</div>
                      </div>
                    </div>
                    <div className={`font-medium ${
                      transaction.type === 'depot' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'depot' ? '+' : '-'}{formatCurrency(transaction.montant)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Clients (Solde)</h2>
            <Link href="/clients" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Voir tout →
            </Link>
          </div>
          <div className="p-6">
            {topClients.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-2">Aucun client avec solde positif</p>
                <Link href="/clients" className="text-blue-600 hover:text-blue-700 text-sm">
                  Gérer les clients
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topClients.map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{client.nom}</div>
                        <div className="text-sm text-gray-600">{client.matricule}</div>
                      </div>
                    </div>
                    <div className="font-bold text-gray-900">
                      {formatCurrency(client.solde)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Evolution */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Évolution des Transactions (7 derniers jours)</h2>
        </div>
        <div className="p-6">
          {evolution.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Aucune donnée d&apos;évolution disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Dépôts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Retraits</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {evolution.map((day, index) => {
                  const maxAmount = Math.max(...evolution.map(d => Math.max(d.depots, d.retraits)))
                  const depotHeight = maxAmount > 0 ? (day.depots / maxAmount) * 100 : 0
                  const retraitHeight = maxAmount > 0 ? (day.retraits / maxAmount) * 100 : 0
                  
                  return (
                    <div key={index} className="text-center">
                      <div className="h-32 flex items-end justify-center gap-1 mb-2">
                        <div 
                          className="w-4 bg-green-500 rounded-t min-h-[4px]"
                          style={{ height: `${Math.max(depotHeight, 4)}px` }}
                          title={`Dépôts: ${formatCurrency(day.depots)}`}
                        ></div>
                        <div 
                          className="w-4 bg-red-500 rounded-t min-h-[4px]"
                          style={{ height: `${Math.max(retraitHeight, 4)}px` }}
                          title={`Retraits: ${formatCurrency(day.retraits)}`}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatEvolutionDate(day.date)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {stats.totalClients === 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pour commencer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/clients" className="p-4 border border-dashed border-gray-300 rounded-lg text-center hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="text-blue-600 mb-2">👥</div>
              <p className="text-gray-600 mb-2">Ajoutez vos premiers clients</p>
              <span className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Gérer les clients →
              </span>
            </Link>
            <Link href="/transactions" className="p-4 border border-dashed border-gray-300 rounded-lg text-center hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="text-blue-600 mb-2">💰</div>
              <p className="text-gray-600 mb-2">Enregistrez vos transactions</p>
              <span className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Gérer les transactions →
              </span>
            </Link>
            <Link href="/commissions" className="p-4 border border-dashed border-gray-300 rounded-lg text-center hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="text-blue-600 mb-2">📊</div>
              <p className="text-gray-600 mb-2">Configurez les commissions</p>
              <span className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Gérer les commissions →
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}