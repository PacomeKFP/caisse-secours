'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, CreditCard, TrendingUp, TrendingDown, Calendar, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import ExportButton from '@/components/ExportButton'

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
  const matricule = params.matricule as string
  const [client, setClient] = useState<Client | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [activeTab, setActiveTab] = useState<'transactions' | 'commissions'>('transactions')
  const [loading, setLoading] = useState(true)
  
  // Filters state
  const [showFilters, setShowFilters] = useState(false)
  const [transactionFilters, setTransactionFilters] = useState({
    type: '', // 'depot' | 'retrait' | ''
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    searchTerm: ''
  })
  const [commissionFilters, setCommissionFilters] = useState({
    moisAnnee: '',
    type: '',
    minCommission: '',
    maxCommission: ''
  })

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch client details by matricule
      const clientResponse = await fetch(`/api/clients?matricule=${matricule}`)
      if (clientResponse.ok) {
        const clientsData = await clientResponse.json()
        const clientData = clientsData.find((c: Client) => c.matricule === matricule)
        if (clientData) {
          setClient(clientData)
          
          // Fetch client transactions using the client ID
          const transactionsResponse = await fetch(`/api/transactions?clientId=${clientData.id}`)
          if (transactionsResponse.ok) {
            const transactionsData = await transactionsResponse.json()
            setTransactions(transactionsData)
          }

          // Fetch client commissions using the client ID
          const commissionsResponse = await fetch(`/api/commissions?clientId=${clientData.id}`)
          if (commissionsResponse.ok) {
            const commissionsData = await commissionsResponse.json()
            setCommissions(commissionsData)
          }
        } else {
          toast.error('Client non trouvé')
        }
      } else {
        toast.error('Client non trouvé')
      }

    } catch (error) {
      console.error('Error fetching client data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [matricule])

  useEffect(() => {
    if (matricule) {
      fetchClientData()
    }
  }, [matricule, fetchClientData])

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

  // Filter functions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = !transactionFilters.type || transaction.type === transactionFilters.type
    const matchesSearch = !transactionFilters.searchTerm || 
      transaction.sourceDestination.toLowerCase().includes(transactionFilters.searchTerm.toLowerCase()) ||
      (transaction.description?.toLowerCase() || '').includes(transactionFilters.searchTerm.toLowerCase())
    
    const transactionDate = new Date(transaction.createdAt)
    const matchesStartDate = !transactionFilters.startDate || transactionDate >= new Date(transactionFilters.startDate)
    const matchesEndDate = !transactionFilters.endDate || transactionDate <= new Date(transactionFilters.endDate + 'T23:59:59')
    
    const matchesMinAmount = !transactionFilters.minAmount || transaction.montant >= parseFloat(transactionFilters.minAmount)
    const matchesMaxAmount = !transactionFilters.maxAmount || transaction.montant <= parseFloat(transactionFilters.maxAmount)

    return matchesType && matchesSearch && matchesStartDate && matchesEndDate && matchesMinAmount && matchesMaxAmount
  })

  const filteredCommissions = commissions.filter(commission => {
    const matchesMois = !commissionFilters.moisAnnee || commission.moisAnnee === commissionFilters.moisAnnee
    const matchesType = !commissionFilters.type || commission.type === commissionFilters.type
    const matchesMinCommission = !commissionFilters.minCommission || commission.commission >= parseFloat(commissionFilters.minCommission)
    const matchesMaxCommission = !commissionFilters.maxCommission || commission.commission <= parseFloat(commissionFilters.maxCommission)

    return matchesMois && matchesType && matchesMinCommission && matchesMaxCommission
  })

  const clearFilters = () => {
    setTransactionFilters({
      type: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      searchTerm: ''
    })
    setCommissionFilters({
      moisAnnee: '',
      type: '',
      minCommission: '',
      maxCommission: ''
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
      <div className="bg-gradient-to-br from-white via-gold-50/30 to-yellow-50/50 rounded-xl border border-gold-200/50 shadow-lg p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{client.nom}</h2>
              <p className="text-gray-700 flex items-center gap-2 mb-1">
                <CreditCard size={18} className="text-gold-600" />
                <span className="font-mono font-semibold text-gold-800">{client.matricule}</span>
              </p>
              <p className="text-gray-700 flex items-center gap-2">
                <Phone size={18} className="text-gold-600" />
                <span className="font-mono">{client.telephone}</span>
              </p>
            </div>
          </div>
          <div className="text-right bg-white/70 p-4 rounded-lg border border-gold-200">
            <p className="text-sm text-gray-600 mb-1">Membre depuis</p>
            <p className="text-lg font-bold text-gold-800">
              {formatDateOnly(client.createdAt)}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50/50 p-6 rounded-xl border-2 border-blue-200/50 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Solde actuel</p>
                <p className={`text-2xl font-bold ${client.solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(client.solde)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 via-white to-green-50/50 p-6 rounded-xl border-2 border-green-200/50 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total dépôts</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(client.totalDepots)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 via-white to-red-50/50 p-6 rounded-xl border-2 border-red-200/50 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total retraits</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(client.totalRetraits)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gradient-to-br from-white via-gray-50/30 to-gray-50/50 rounded-xl border border-gray-200/50 shadow-lg">
        <div className="border-b border-gray-200/50">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-8 py-5 text-sm font-semibold border-b-3 transition-all duration-200 ${
                activeTab === 'transactions'
                  ? 'border-gold-500 text-gold-600 bg-gradient-to-t from-gold-50/50 to-transparent'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                Transactions ({filteredTransactions.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`px-8 py-5 text-sm font-semibold border-b-3 transition-all duration-200 ${
                activeTab === 'commissions'
                  ? 'border-gold-500 text-gold-600 bg-gradient-to-t from-gold-50/50 to-transparent'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={16} />
                Commissions ({filteredCommissions.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Filters Section */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gold-50/20 to-yellow-50/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === 'transactions' ? 'Filtrer les transactions' : 'Filtrer les commissions'}
            </h3>
            <div className="flex items-center gap-2">
              <ExportButton 
                data={activeTab === 'transactions' ? filteredTransactions : filteredCommissions} 
                filename={`${client?.nom.replace(/\s+/g, '_')}_${activeTab}`} 
                type={activeTab as 'transactions' | 'commissions'}
                disabled={loading}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-200 ${
                  showFilters 
                    ? 'bg-gold-50 border-gold-300 text-gold-700 shadow-md' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <Filter size={16} />
                {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4">
              {activeTab === 'transactions' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      value={transactionFilters.searchTerm}
                      onChange={(e) => setTransactionFilters({...transactionFilters, searchTerm: e.target.value})}
                    />
                  </div>
                  
                  <select
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    value={transactionFilters.type}
                    onChange={(e) => setTransactionFilters({...transactionFilters, type: e.target.value})}
                  >
                    <option value="">Tous les types</option>
                    <option value="depot">Dépôts</option>
                    <option value="retrait">Retraits</option>
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      placeholder="Date début"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      value={transactionFilters.startDate}
                      onChange={(e) => setTransactionFilters({...transactionFilters, startDate: e.target.value})}
                    />
                    <input
                      type="date"
                      placeholder="Date fin"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      value={transactionFilters.endDate}
                      onChange={(e) => setTransactionFilters({...transactionFilters, endDate: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Montant min"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      value={transactionFilters.minAmount}
                      onChange={(e) => setTransactionFilters({...transactionFilters, minAmount: e.target.value})}
                    />
                    <input
                      type="number"
                      placeholder="Montant max"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                      value={transactionFilters.maxAmount}
                      onChange={(e) => setTransactionFilters({...transactionFilters, maxAmount: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Mois/Année (ex: 2024-01)"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    value={commissionFilters.moisAnnee}
                    onChange={(e) => setCommissionFilters({...commissionFilters, moisAnnee: e.target.value})}
                  />
                  
                  <input
                    type="text"
                    placeholder="Type de commission"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    value={commissionFilters.type}
                    onChange={(e) => setCommissionFilters({...commissionFilters, type: e.target.value})}
                  />

                  <input
                    type="number"
                    placeholder="Commission min"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    value={commissionFilters.minCommission}
                    onChange={(e) => setCommissionFilters({...commissionFilters, minCommission: e.target.value})}
                  />

                  <input
                    type="number"
                    placeholder="Commission max"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    value={commissionFilters.maxCommission}
                    onChange={(e) => setCommissionFilters({...commissionFilters, maxCommission: e.target.value})}
                  />
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Effacer les filtres
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'transactions' ? (
            <div>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                    <Calendar className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {transactions.length === 0 ? 'Aucune transaction' : 'Aucun résultat'}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {transactions.length === 0 
                      ? "Ce client n'a encore effectué aucune transaction" 
                      : "Aucune transaction ne correspond à vos critères de recherche"
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gold-200/50 shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gold-50 to-yellow-100 border-b-2 border-gold-300">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-gold-900">Date</th>
                        <th className="text-left py-4 px-6 font-semibold text-gold-900">Type</th>
                        <th className="text-right py-4 px-6 font-semibold text-gold-900">Montant</th>
                        <th className="text-left py-4 px-6 font-semibold text-gold-900">Source/Destination</th>
                        <th className="text-left py-4 px-6 font-semibold text-gold-900">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold-100">
                      {filteredTransactions.map((transaction, index) => (
                        <tr 
                          key={transaction.id} 
                          className={`hover:bg-gradient-to-r transition-all duration-200 ${
                            index % 2 === 0 
                              ? 'bg-white hover:from-gold-50/30 hover:to-yellow-50/20' 
                              : 'bg-gold-50/20 hover:from-gold-50/50 hover:to-yellow-50/30'
                          }`}
                        >
                          <td className="py-4 px-6 text-sm text-gray-700 font-medium">
                            <span className="bg-gradient-to-r from-gold-100 to-yellow-100 px-2 py-1 rounded-md border border-gold-200 shadow-sm">
                              {formatDate(transaction.createdAt)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm">
                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
                              transaction.type === 'depot' 
                                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300' 
                                : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300'
                            }`}>
                              {transaction.type === 'depot' ? 'Dépôt' : 'Retrait'}
                            </span>
                          </td>
                          <td className={`py-4 px-6 text-sm text-right font-bold text-lg ${
                            transaction.type === 'depot' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            <span className={`px-3 py-1 rounded-lg shadow-sm ${
                              transaction.type === 'depot' 
                                ? 'bg-gradient-to-r from-green-100 to-green-200 border border-green-300' 
                                : 'bg-gradient-to-r from-red-100 to-red-200 border border-red-300'
                            }`}>
                              {transaction.type === 'depot' ? '+' : '-'}{formatCurrency(transaction.montant)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700 font-medium">
                            <span className="bg-gold-50 px-2 py-1 rounded-md border border-gold-200">
                              {transaction.sourceDestination}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
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
              {filteredCommissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {commissions.length === 0 ? 'Aucune commission' : 'Aucun résultat'}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {commissions.length === 0 
                      ? "Aucune commission n'a été calculée pour ce client" 
                      : "Aucune commission ne correspond à vos critères de recherche"
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200/50 shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Période</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Type</th>
                        <th className="text-right py-4 px-6 font-semibold text-gray-900">Montant total</th>
                        <th className="text-right py-4 px-6 font-semibold text-gray-900">Commission</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Description</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Date calcul</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCommissions.map((commission, index) => (
                        <tr 
                          key={commission.id} 
                          className={`hover:bg-gradient-to-r transition-all duration-200 ${
                            index % 2 === 0 
                              ? 'bg-white hover:from-purple-50/30 hover:to-purple-50/10' 
                              : 'bg-gray-50/30 hover:from-purple-50/50 hover:to-purple-50/20'
                          }`}
                        >
                          <td className="py-4 px-6 text-sm font-bold text-gray-900">
                            <span className="bg-gradient-to-r from-gold-100 to-yellow-100 px-3 py-1 rounded-lg border border-gold-200 shadow-sm">
                              {commission.moisAnnee}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm">
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
                              {commission.type}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-right font-semibold text-gray-900">
                            <span className="bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                              {formatCurrency(commission.montantTotal)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-right font-bold text-lg">
                            <span className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-3 py-1 rounded-lg border border-purple-300 shadow-sm">
                              {formatCurrency(commission.commission)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700 font-medium">
                            {commission.label}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
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