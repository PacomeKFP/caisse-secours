'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Trash2, Upload, Calendar, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import TransactionModal from '@/components/TransactionModal'
import ExportButton from '@/components/ExportButton'

interface Transaction {
  id: string
  clientId: string
  type: 'depot' | 'retrait'
  montant: number
  description?: string
  sourceDestination: string
  createdAt: string
  clientNom: string
  clientMatricule: string
}

type SortField = 'createdAt' | 'clientNom' | 'type' | 'montant' | 'sourceDestination'
type SortOrder = 'asc' | 'desc'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'depot' | 'retrait'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [montantMin, setMontantMin] = useState('')
  const [montantMax, setMontantMax] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.clientMatricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.sourceDestination.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || transaction.type === typeFilter

    const matchesSource = sourceFilter === '' || 
      transaction.sourceDestination.toLowerCase().includes(sourceFilter.toLowerCase())

    const transactionDate = new Date(transaction.createdAt)
    const matchesStartDate = startDate === '' || transactionDate >= new Date(startDate)
    const matchesEndDate = endDate === '' || transactionDate <= new Date(endDate + 'T23:59:59')
    
    const matchesMontantMin = montantMin === '' || transaction.montant >= parseFloat(montantMin)
    const matchesMontantMax = montantMax === '' || transaction.montant <= parseFloat(montantMax)

    return matchesSearch && matchesType && matchesSource && matchesStartDate && matchesEndDate && matchesMontantMin && matchesMontantMax
  })

  const sortedTransactions = filteredTransactions.sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]
    
    if (sortField === 'createdAt') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      } else {
        toast.error('Erreur lors du chargement des transactions')
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette transaction de ${formatCurrency(transaction.montant)} pour ${transaction.clientNom} ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Transaction supprimée avec succès')
        fetchTransactions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast.error('Veuillez sélectionner un fichier JSON')
      return
    }

    setUploading(true)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const response = await fetch('/api/transactions/batch-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: data })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Import terminé: ${result.successful} succès, ${result.failed} échecs`)
        if (result.errors.length > 0) {
          console.log('Erreurs d\'import:', result.errors)
        }
        fetchTransactions()
      } else {
        toast.error(result.error || 'Erreur lors de l\'import')
      }
    } catch (error) {
      toast.error('Erreur lors de la lecture du fichier JSON')
    } finally {
      setUploading(false)
      // Reset input
      event.target.value = ''
    }
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSourceFilter('')
    setMontantMin('')
    setMontantMax('')
    setTypeFilter('all')
    setSearchTerm('')
    setCurrentPage(1)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp size={14} className="text-gray-400" />
    }
    return sortOrder === 'asc' ? 
      <ChevronUp size={14} className="text-gold-600" /> : 
      <ChevronDown size={14} className="text-gold-600" />
  }

  const formatCurrency = (amount: number) => {
    // Use consistent formatting to avoid hydration issues
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA'
  }

  const formatDate = (dateString: string) => {
    // Use consistent date formatting to avoid hydration issues
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const getTotals = () => {
    const depots = sortedTransactions
      .filter(t => t.type === 'depot')
      .reduce((sum, t) => sum + t.montant, 0)
    
    const retraits = sortedTransactions
      .filter(t => t.type === 'retrait')
      .reduce((sum, t) => sum + t.montant, 0)

    return { depots, retraits, net: depots - retraits }
  }

  const totals = getTotals()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Gérez les dépôts et retraits de vos clients</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
        >
          <Plus size={20} />
          Nouvelle Transaction
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-xl border-2 border-green-200 shadow-md hover:shadow-lg transition-all duration-200 hover:border-green-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Dépôts</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">{formatCurrency(totals.depots)}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-red-50 p-6 rounded-xl border-2 border-red-200 shadow-md hover:shadow-lg transition-all duration-200 hover:border-red-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Retraits</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">{formatCurrency(totals.retraits)}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-white p-6 rounded-xl border-2 shadow-md hover:shadow-lg transition-all duration-200 ${
          totals.net >= 0 
            ? 'to-gold-50 border-gold-200 hover:border-gold-300' 
            : 'to-red-50 border-red-200 hover:border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Solde Net</p>
              <p className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                totals.net >= 0 
                  ? 'from-gold-600 to-yellow-600' 
                  : 'from-red-600 to-red-700'
              }`}>
                {formatCurrency(totals.net)}
              </p>
            </div>
            <div className={`p-3 rounded-xl shadow-md bg-gradient-to-r ${
              totals.net >= 0 
                ? 'from-gold-500 to-yellow-500' 
                : 'from-red-500 to-red-600'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par client, description ou source..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-gold-50 border-gold-300 text-gold-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
              Filtres
            </button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer transition-colors ${
                  uploading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Upload size={16} />
                {uploading ? 'Import...' : 'Import JSON'}
              </label>
            </div>
            <ExportButton 
              data={filteredTransactions} 
              filename="transactions" 
              type="transactions"
              disabled={loading}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de transaction
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'depot' | 'retrait')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                >
                  <option value="all">Tous les types</option>
                  <option value="depot">Dépôts uniquement</option>
                  <option value="retrait">Retraits uniquement</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source/Destination
                </label>
                <input
                  type="text"
                  placeholder="Filtrer par source..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant minimum (FCFA)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  value={montantMin}
                  onChange={(e) => setMontantMin(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant maximum (FCFA)
                </label>
                <input
                  type="number"
                  placeholder="1000000"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  value={montantMax}
                  onChange={(e) => setMontantMax(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
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

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ArrowUpDown size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || typeFilter !== 'all' || showFilters ? 'Aucune transaction trouvée' : 'Aucune transaction'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter !== 'all' || showFilters
                ? 'Aucune transaction ne correspond à vos critères' 
                : 'Commencez par enregistrer votre première transaction'
              }
            </p>
            {!searchTerm && typeFilter === 'all' && !showFilters && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
              >
                Ajouter une transaction
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gold-200/50 shadow-sm">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gold-50 to-yellow-100 border-b-2 border-gold-300">
                  <tr>
                    <th 
                      onClick={() => handleSort('createdAt')}
                      className="text-left py-4 px-6 font-semibold text-gold-900 cursor-pointer hover:bg-gold-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Date
                        <SortIcon field="createdAt" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('clientNom')}
                      className="text-left py-4 px-6 font-semibold text-gold-900 cursor-pointer hover:bg-gold-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Client
                        <SortIcon field="clientNom" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('type')}
                      className="text-left py-4 px-6 font-semibold text-gold-900 cursor-pointer hover:bg-gold-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Type
                        <SortIcon field="type" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('montant')}
                      className="text-right py-4 px-6 font-semibold text-gold-900 cursor-pointer hover:bg-gold-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center justify-end gap-2">
                        Montant
                        <SortIcon field="montant" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('sourceDestination')}
                      className="text-left py-4 px-6 font-semibold text-gold-900 cursor-pointer hover:bg-gold-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Source/Destination
                        <SortIcon field="sourceDestination" />
                      </div>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gold-900">Description</th>
                    <th className="text-center py-4 px-6 font-semibold text-gold-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedTransactions.map((transaction, index) => (
                    <tr key={transaction.id} className={`hover:bg-gradient-to-r hover:from-gold-50 hover:to-yellow-50 transition-all duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}>
                      <td className="py-4 px-6 text-sm text-gray-600 border-l-2 border-transparent hover:border-gold-400">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div>
                          <div className="font-semibold text-gray-900">{transaction.clientNom}</div>
                          <div className="text-gray-600 font-mono text-xs">{transaction.clientMatricule}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                          transaction.type === 'depot' 
                            ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' 
                            : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                        }`}>
                          {transaction.type === 'depot' ? 'Dépôt' : 'Retrait'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <span className={`font-bold px-3 py-1 rounded-lg shadow-sm ${
                          transaction.type === 'depot' 
                            ? 'text-green-600 bg-green-50' 
                            : 'text-red-600 bg-red-50'
                        }`}>
                          {transaction.type === 'depot' ? '+' : '-'}{formatCurrency(transaction.montant)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className="text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">
                          {transaction.sourceDestination}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {transaction.description ? (
                          <span className="bg-yellow-50 px-2 py-1 rounded text-xs">
                            {transaction.description}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleDeleteTransaction(transaction)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200 transform hover:scale-105"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gold-50/50 to-yellow-50/50 border-t border-gold-200">
                <div className="text-sm font-medium text-gray-700">
                  Affichage de <span className="font-bold text-gold-600">{((currentPage - 1) * itemsPerPage) + 1}</span> à <span className="font-bold text-gold-600">{Math.min(currentPage * itemsPerPage, sortedTransactions.length)}</span> sur <span className="font-bold text-gold-600">{sortedTransactions.length}</span> transactions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 text-sm bg-white border-2 border-gold-300 rounded-lg hover:bg-gradient-to-r hover:from-gold-50 hover:to-yellow-50 hover:border-gold-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 font-medium text-gold-700"
                  >
                    <ChevronLeft size={16} />
                    Précédent
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 text-sm rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-gold-500 to-yellow-500 text-white shadow-md border-2 border-gold-400'
                              : 'bg-white border-2 border-gold-300 text-gold-700 hover:bg-gradient-to-r hover:from-gold-50 hover:to-yellow-50 hover:border-gold-400'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 text-sm bg-white border-2 border-gold-300 rounded-lg hover:bg-gradient-to-r hover:from-gold-50 hover:to-yellow-50 hover:border-gold-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 font-medium text-gold-700"
                  >
                    Suivant
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  )
}

function ArrowUpDown({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
      />
    </svg>
  )
}