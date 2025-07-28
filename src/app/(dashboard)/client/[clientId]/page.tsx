'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, CreditCard, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Client {
  id: string
  matricule: string
  nom: string
  telephone: string
  solde: number
  totalDepots: number
  totalRetraits: number
  createdAt: string
  updatedAt: string
}

interface Transaction {
  id: string
  type: 'depot' | 'retrait'
  montant: number
  description?: string
  sourceDestination: string
  createdAt: string
}

interface Commission {
  id: string
  montantTotal: number
  commission: number
  label: string
  type: string
  moisAnnee: string
  createdAt: string
}

export default function ClientProfilePage() {
  const params = useParams()
  const clientId = params.clientId as string
  const [client, setClient] = useState<Client | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [activeTab, setActiveTab] = useState<'transactions' | 'commissions'>('transactions')
  const [loading, setLoading] = useState(true)

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch client details
      const clientResponse = await fetch(`/api/clients/${clientId}`)
      if (clientResponse.ok) {
        const clientData = await clientResponse.json()
        setClient(clientData)
      } else {
        toast.error('Client non trouvé')
        return
      }

      // Fetch client transactions
      const transactionsResponse = await fetch(`/api/transactions?clientId=${clientId}`)
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData)
      }

      // Fetch client commissions
      const commissionsResponse = await fetch(`/api/commissions?clientId=${clientId}`)
      if (commissionsResponse.ok) {
        const commissionsData = await commissionsResponse.json()
        setCommissions(commissionsData)
      }

    } catch (error) {
      console.error('Error fetching client data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (clientId) {
      fetchClientData()
    }
  }, [clientId, fetchClientData])

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="space-y-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Client non trouvé</p>
        <Link 
          href="/clients" 
          className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700"
        >
          <ArrowLeft size={16} />
          Retour aux clients
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/clients" 
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profil Client</h1>
            <p className="text-gray-600">Détails et historique du client</p>
          </div>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gold-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{client.nom}</h2>
              <p className="text-gray-600 flex items-center gap-2">
                <CreditCard size={16} />
                {client.matricule}
              </p>
              <p className="text-gray-600 flex items-center gap-2">
                <Phone size={16} />
                {client.telephone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Membre depuis</p>
            <p className="text-lg font-medium text-gray-900">
              {formatDateOnly(client.createdAt)}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Solde actuel</p>
                <p className={`text-xl font-bold ${client.solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(client.solde)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total dépôts</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(client.totalDepots)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total retraits</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(client.totalRetraits)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'transactions'
                  ? 'border-gold-500 text-gold-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transactions ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'commissions'
                  ? 'border-gold-500 text-gold-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Commissions ({commissions.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'transactions' ? (
            <div>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune transaction
                  </h3>
                  <p className="text-gray-600">
                    Ce client n&apos;a encore effectué aucune transaction
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Montant</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Source/Destination</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((transaction, index) => (
                        <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(transaction.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'depot' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type === 'depot' ? 'Dépôt' : 'Retrait'}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-sm text-right font-medium ${
                            transaction.type === 'depot' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'depot' ? '+' : '-'}{formatCurrency(transaction.montant)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {transaction.sourceDestination}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {transaction.description || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              {commissions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune commission
                  </h3>
                  <p className="text-gray-600">
                    Aucune commission n&apos;a été calculée pour ce client
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Période</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Montant total</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Commission</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date calcul</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {commissions.map((commission, index) => (
                        <tr key={commission.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                            {commission.moisAnnee}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {commission.type}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-900">
                            {formatCurrency(commission.montantTotal)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-medium text-purple-600">
                            {formatCurrency(commission.commission)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {commission.label}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(commission.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}