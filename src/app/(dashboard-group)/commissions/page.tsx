'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Play, Search, Filter, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import CommissionConfigModal from '@/components/CommissionConfigModal'
import CommissionCollectModal from '@/components/CommissionCollectModal'
import ExportButton from '@/components/ExportButton'
// Note: CommissionService import moved to API calls only

interface Commission {
  id: string
  clientId: string
  montantTotal: number
  commission: number
  label: string
  type: string
  moisAnnee: string
  createdAt: string
  clientNom: string
  clientMatricule: string
}

interface CommissionConfig {
  id: string
  montantMin: number
  montantMax: number | null
  montant: number
  ordre: number
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [config, setConfig] = useState<CommissionConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [commissionMin, setCommissionMin] = useState('')
  const [commissionMax, setCommissionMax] = useState('')
  const [sortField, setSortField] = useState<'createdAt' | 'clientNom' | 'moisAnnee' | 'montantTotal' | 'commission'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = 
      commission.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.clientMatricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.label.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesMonth = monthFilter === 'all' || commission.moisAnnee === monthFilter
    
    const commissionDate = new Date(commission.createdAt)
    const matchesStartDate = startDate === '' || commissionDate >= new Date(startDate)
    const matchesEndDate = endDate === '' || commissionDate <= new Date(endDate + 'T23:59:59')
    
    const matchesCommissionMin = commissionMin === '' || commission.commission >= parseFloat(commissionMin)
    const matchesCommissionMax = commissionMax === '' || commission.commission <= parseFloat(commissionMax)

    return matchesSearch && matchesMonth && matchesStartDate && matchesEndDate && matchesCommissionMin && matchesCommissionMax
  })

  const sortedCommissions = filteredCommissions.sort((a, b) => {
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

  const totalPages = Math.ceil(sortedCommissions.length / itemsPerPage)
  const paginatedCommissions = sortedCommissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const fetchCommissions = async () => {
    try {
      const response = await fetch('/api/commissions')
      if (response.ok) {
        const data = await response.json()
        setCommissions(data)
      } else {
        toast.error('Erreur lors du chargement des commissions')
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des commissions')
    }
  }

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/commissions/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      } else {
        toast.error('Erreur lors du chargement de la configuration')
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de la configuration')
    }
  }

  const fetchAvailableMonths = useCallback(async () => {
    try {
      // Extract unique months from commissions data
      const uniqueMonths = [...new Set(commissions.map(c => c.moisAnnee))].sort().reverse()
      setAvailableMonths(uniqueMonths)
    } catch (error) {
      console.error('Error fetching available months:', error)
    }
  }, [commissions])

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchCommissions(),
        fetchConfig()
      ])
      setLoading(false)
    }
    
    loadData()
  }, [])

  // Update available months when commissions change
  useEffect(() => {
    fetchAvailableMonths()
  }, [commissions, fetchAvailableMonths])

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
    return `${day}/${month}/${year}`
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    return `${months[parseInt(month) - 1]} ${year}`
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setCommissionMin('')
    setCommissionMax('')
    setSearchTerm('')
    setMonthFilter('all')
    setCurrentPage(1)
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) {
      return <ChevronUp size={14} className="text-gray-400" />
    }
    return sortOrder === 'asc' ? 
      <ChevronUp size={14} className="text-gold-600" /> : 
      <ChevronDown size={14} className="text-gold-600" />
  }

  const getTotals = () => {
    const total = sortedCommissions.reduce((sum, c) => sum + c.commission, 0)
    const count = sortedCommissions.length
    const average = count > 0 ? total / count : 0
    
    // Calculer le nombre de mois uniques collectés
    const uniqueMonths = [...new Set(sortedCommissions.map(c => c.moisAnnee))].length

    return { total, count, average, uniqueMonths }
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
          <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>
          <p className="text-gray-600">Gérez la collecte des commissions mensuelles</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings size={20} />
            Configuration
          </button>
          <button
            onClick={() => setIsCollectModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
          >
            <Play size={20} />
            Lancer Collecte
          </button>
          <ExportButton 
            data={filteredCommissions} 
            filename="commissions" 
            type="commissions"
            disabled={loading}
          />
        </div>
      </div>

      {/* Configuration Summary - Collapsible */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div 
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-gradient-to-r hover:from-gold-50 hover:to-yellow-50 transition-all duration-200 border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-gold-500 to-yellow-500 rounded-lg shadow-md">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Configuration des Tranches</h2>
              <p className="text-sm text-gray-600">
                {config.length === 0 
                  ? 'Aucune configuration définie - Cliquez pour configurer' 
                  : `${config.length} tranche${config.length > 1 ? 's' : ''} configurée${config.length > 1 ? 's' : ''} - Cliquez pour ${showConfig ? 'masquer' : 'afficher'}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {config.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs font-semibold rounded-full shadow-sm">
                  {config.length} tranche{config.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
            <ChevronDown 
              className={`w-5 h-5 text-gold-600 transition-transform duration-200 ${
                showConfig ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </div>
        
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
          showConfig ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="p-6 bg-gradient-to-br from-gold-50/30 to-yellow-50/30 border-t border-gold-100">
            {config.length === 0 ? (
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-gold-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-8 h-8 text-gold-600" />
                  </div>
                  <p className="text-gray-600 mb-4">Aucune configuration définie</p>
                  <p className="text-sm text-gray-500 mb-6">Configurez les tranches de commission pour automatiser le calcul</p>
                </div>
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-gold-500 to-yellow-500 text-white rounded-lg hover:from-gold-600 hover:to-yellow-600 transition-all duration-200 shadow-md transform hover:scale-105 font-semibold"
                >
                  Configurer les tranches
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-md font-semibold text-gray-900">Tranches Configurées</h3>
                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-gold-500 to-yellow-500 text-white rounded-lg hover:from-gold-600 hover:to-yellow-600 transition-all duration-200 shadow-sm transform hover:scale-105"
                  >
                    <Settings size={16} />
                    Modifier
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {config.map((tranche, index) => (
                    <div key={tranche.id} className="relative p-5 bg-white border-2 border-gold-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-gold-300 group">
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-gold-500 to-yellow-500 text-white text-xs font-bold rounded-full shadow-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gold-600 uppercase tracking-wide mb-1">Tranche {index + 1}</div>
                        <div className="text-sm font-medium text-gray-700 leading-tight">
                          {formatCurrency(tranche.montantMin).replace(' FCFA', '')} - {tranche.montantMax ? formatCurrency(tranche.montantMax).replace(' FCFA', '') : '∞'} FCFA
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Commission fixe</div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-gold-600 to-yellow-600 bg-clip-text text-transparent">
                            {formatCurrency(tranche.montant)}
                          </div>
                        </div>
                        <div className="p-2 bg-gradient-to-r from-gold-100 to-yellow-100 rounded-lg group-hover:from-gold-200 group-hover:to-yellow-200 transition-all duration-200">
                          <svg className="w-4 h-4 text-gold-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-xl border-2 border-green-200 shadow-md hover:shadow-lg transition-all duration-200 hover:border-green-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Collecté</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">{formatCurrency(totals.total)}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gold-50 p-6 rounded-xl border-2 border-gold-200 shadow-md hover:shadow-lg transition-all duration-200 hover:border-gold-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-1">Commissions & Périodes</p>
              <div className="flex items-baseline gap-2 mb-2">
                <p className="text-2xl font-bold bg-gradient-to-r from-gold-600 to-yellow-600 bg-clip-text text-transparent">{totals.count}</p>
                <span className="text-sm text-gray-500">commissions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gradient-to-r from-gold-100 to-yellow-100 text-gold-700 text-xs font-semibold rounded-full">
                  {totals.uniqueMonths} mois {totals.uniqueMonths > 1 ? 'collectés' : 'collecté'}
                </span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-r from-gold-500 to-yellow-500 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-xl border-2 border-purple-200 shadow-md hover:shadow-lg transition-all duration-200 hover:border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Commission Moyenne</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">{formatCurrency(totals.average)}</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par client ou libellé..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            >
              <option value="all">Tous les mois</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-gold-50 border-gold-300 text-gold-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
              Filtres avancés
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission minimum (FCFA)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  value={commissionMin}
                  onChange={(e) => setCommissionMin(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission maximum (FCFA)
                </label>
                <input
                  type="number"
                  placeholder="100000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  value={commissionMax}
                  onChange={(e) => setCommissionMax(e.target.value)}
                />
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

      {/* Commissions Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {paginatedCommissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || monthFilter !== 'all' || showFilters ? 'Aucune commission trouvée' : 'Aucune commission collectée'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || monthFilter !== 'all' || showFilters
                ? 'Aucune commission ne correspond à vos critères' 
                : 'Commencez par lancer votre première collecte mensuelle'
              }
            </p>
            {!searchTerm && monthFilter === 'all' && !showFilters && (
              <button
                onClick={() => setIsCollectModalOpen(true)}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
              >
                Lancer une collecte
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-purple-200/50 shadow-sm">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-300">
                  <tr>
                    <th 
                      onClick={() => handleSort('createdAt')}
                      className="text-left py-4 px-6 font-semibold text-purple-900 cursor-pointer hover:bg-purple-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Date
                        <SortIcon field="createdAt" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('clientNom')}
                      className="text-left py-4 px-6 font-semibold text-purple-900 cursor-pointer hover:bg-purple-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Client
                        <SortIcon field="clientNom" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('moisAnnee')}
                      className="text-left py-4 px-6 font-semibold text-purple-900 cursor-pointer hover:bg-purple-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Mois
                        <SortIcon field="moisAnnee" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('montantTotal')}
                      className="text-right py-4 px-6 font-semibold text-purple-900 cursor-pointer hover:bg-purple-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center justify-end gap-2">
                        Solde Base
                        <SortIcon field="montantTotal" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('commission')}
                      className="text-right py-4 px-6 font-semibold text-purple-900 cursor-pointer hover:bg-purple-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center justify-end gap-2">
                        Commission
                        <SortIcon field="commission" />
                      </div>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Libellé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedCommissions.map((commission, index) => (
                    <tr key={commission.id} className={`hover:bg-gradient-to-r hover:from-gold-50 hover:to-yellow-50 transition-all duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}>
                      <td className="py-4 px-6 text-sm text-gray-600 border-l-2 border-transparent hover:border-gold-400">
                        {formatDate(commission.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div>
                          <div className="font-semibold text-gray-900">{commission.clientNom}</div>
                          <div className="text-gray-600 font-mono text-xs">{commission.clientMatricule}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm">
                          {formatMonth(commission.moisAnnee)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                          {formatCurrency(commission.montantTotal)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <span className="font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg shadow-sm">
                          {formatCurrency(commission.commission)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        <span className="bg-yellow-50 px-2 py-1 rounded text-xs">
                          {commission.label}
                        </span>
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
                  Affichage de <span className="font-bold text-gold-600">{((currentPage - 1) * itemsPerPage) + 1}</span> à <span className="font-bold text-gold-600">{Math.min(currentPage * itemsPerPage, sortedCommissions.length)}</span> sur <span className="font-bold text-gold-600">{sortedCommissions.length}</span> commissions
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

      {/* Modals */}
      <CommissionConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSuccess={() => {
          fetchConfig()
          toast.success('Configuration mise à jour')
        }}
      />

      <CommissionCollectModal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        onSuccess={() => {
          fetchCommissions()
          fetchAvailableMonths()
        }}
      />
    </div>
  )
}