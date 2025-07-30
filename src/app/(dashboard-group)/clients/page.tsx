'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Eye, Filter, Upload, Calendar, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import ClientModal from '@/components/ClientModal'
import TransactionModal from '@/components/TransactionModal'
import ExportButton from '@/components/ExportButton'

interface Client {
  id: string
  matricule: string
  nom: string
  telephone: string
  solde: number
  totalDepots: number
  totalRetraits: number
  totalCommissions: number
  createdAt: string
}

type SortField = 'matricule' | 'nom' | 'telephone' | 'solde' | 'totalDepots' | 'totalRetraits' | 'totalCommissions' | 'createdAt'
type SortOrder = 'asc' | 'desc'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [soldeMin, setSoldeMin] = useState('')
  const [soldeMax, setSoldeMax] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [selectedClientForTransaction, setSelectedClientForTransaction] = useState<Client | null>(null)

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telephone.includes(searchTerm)

    const clientDate = new Date(client.createdAt)
    const matchesStartDate = startDate === '' || clientDate >= new Date(startDate)
    const matchesEndDate = endDate === '' || clientDate <= new Date(endDate + 'T23:59:59')
    
    const matchesSoldeMin = soldeMin === '' || client.solde >= parseFloat(soldeMin)
    const matchesSoldeMax = soldeMax === '' || client.solde <= parseFloat(soldeMax)

    return matchesSearch && matchesStartDate && matchesEndDate && matchesSoldeMin && matchesSoldeMax
  })

  const sortedClients = filteredClients.sort((a, b) => {
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

  const totalPages = Math.ceil(sortedClients.length / itemsPerPage)
  const paginatedClients = sortedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      } else {
        toast.error('Erreur lors du chargement des clients')
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleCreateClient = () => {
    setSelectedClient(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleDeleteClient = async (client: Client) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.nom} ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Client supprimé avec succès')
        fetchClients()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleAddTransaction = (client: Client) => {
    setSelectedClientForTransaction(client)
    setIsTransactionModalOpen(true)
  }

  const handleTransactionSuccess = () => {
    setIsTransactionModalOpen(false)
    setSelectedClientForTransaction(null)
    fetchClients() // Refresh client data to update balances
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

      const response = await fetch('/api/clients/batch-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clients: data })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Import terminé: ${result.successful} succès, ${result.failed} échecs`)
        if (result.errors.length > 0) {
          console.log('Erreurs d\'import:', result.errors)
        }
        fetchClients()
      } else {
        toast.error(result.error || 'Erreur lors de l\'import')
      }
    } catch (error) {
      toast.error('Erreur lors de la lecture du fichier JSON')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSoldeMin('')
    setSoldeMax('')
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
    return amount.toLocaleString('fr-FR') + ' FCFA'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Gérez vos clients et leurs informations</p>
        </div>
        <button
          onClick={handleCreateClient}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
        >
          <Plus size={20} />
          Nouveau Client
        </button>
      </div>

      {/* Search and Actions */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule ou téléphone..."
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
              data={filteredClients} 
              filename="clients" 
              type="clients"
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
                  Date de création (début)
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
                  Date de création (fin)
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
                  Solde minimum (FCFA)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  value={soldeMin}
                  onChange={(e) => setSoldeMin(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solde maximum (FCFA)
                </label>
                <input
                  type="number"
                  placeholder="1000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  value={soldeMax}
                  onChange={(e) => setSoldeMax(e.target.value)}
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

      {/* Clients Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {paginatedClients.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || showFilters ? 'Aucun client trouvé' : 'Aucun client'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || showFilters
                ? 'Aucun client ne correspond à vos critères' 
                : 'Commencez par ajouter votre premier client'
              }
            </p>
            {!searchTerm && !showFilters && (
              <button
                onClick={handleCreateClient}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
              >
                Ajouter un client
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-blue-200/50 shadow-sm">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-300">
                  <tr>
                    <th 
                      onClick={() => handleSort('nom')}
                      className="text-left py-4 px-6 font-semibold text-blue-900 cursor-pointer hover:bg-blue-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Client
                        <SortIcon field="nom" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('telephone')}
                      className="text-left py-4 px-6 font-semibold text-blue-900 cursor-pointer hover:bg-blue-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Téléphone
                        <SortIcon field="telephone" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('totalDepots')}
                      className="text-right py-4 px-6 font-semibold text-blue-900 cursor-pointer hover:bg-blue-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center justify-end gap-2">
                        Total Dépôts
                        <SortIcon field="totalDepots" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('totalRetraits')}
                      className="text-right py-4 px-6 font-semibold text-blue-900 cursor-pointer hover:bg-blue-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center justify-end gap-2">
                        Total Retraits
                        <SortIcon field="totalRetraits" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('totalCommissions')}
                      className="text-right py-4 px-6 font-semibold text-blue-900 cursor-pointer hover:bg-blue-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center justify-end gap-2">
                        Commissions
                        <SortIcon field="totalCommissions" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('solde')}
                      className="text-right py-4 px-6 font-semibold text-blue-900 cursor-pointer hover:bg-blue-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center justify-end gap-2">
                        Solde
                        <SortIcon field="solde" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('createdAt')}
                      className="text-left py-4 px-6 font-semibold text-blue-900 cursor-pointer hover:bg-blue-200/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Date création
                        <SortIcon field="createdAt" />
                      </div>
                    </th>
                    <th className="text-center py-4 px-6 font-semibold text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedClients.map((client, index) => (
                    <tr 
                      key={client.id} 
                      onClick={() => window.location.href = `/clients/${client.matricule}`}
                      className={`hover:bg-gradient-to-r hover:from-gold-50 hover:to-yellow-50 transition-all duration-200 cursor-pointer ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="py-4 px-6 text-sm text-gray-900 border-l-2 border-transparent hover:border-gold-400">
                        <div>
                          <span className="font-semibold text-gold-600 block">
                            {client.nom}
                          </span>
                          <span className="font-mono text-xs text-gray-500">
                            {client.matricule}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 font-mono">
                        {client.telephone}
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <span className="font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                          {formatCurrency(client.totalDepots)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <span className="font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                          {formatCurrency(client.totalRetraits)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <span className="font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                          {formatCurrency(client.totalCommissions)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <span className={`font-bold px-3 py-1 rounded-lg ${
                          client.solde >= 0 
                            ? 'text-gray-900 bg-gray-100' 
                            : 'text-red-800 bg-red-100'
                        }`}>
                          {formatCurrency(client.solde)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {formatDate(client.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div 
                          className="flex items-center justify-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleAddTransaction(client)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all duration-200 transform hover:scale-105"
                            title="Ajouter une transaction"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => handleEditClient(client)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 transform hover:scale-105"
                            title="Modifier"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client)}
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
                  Affichage de <span className="font-bold text-gold-600">{((currentPage - 1) * itemsPerPage) + 1}</span> à <span className="font-bold text-gold-600">{Math.min(currentPage * itemsPerPage, sortedClients.length)}</span> sur <span className="font-bold text-gold-600">{sortedClients.length}</span> clients
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
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchClients}
        client={selectedClient}
        mode={modalMode}
      />
      
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        preselectedClient={selectedClientForTransaction}
      />
    </div>
  )
}

function Users({ size, className }: { size: number; className?: string }) {
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
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
      />
    </svg>
  )
}