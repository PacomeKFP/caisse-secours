'use client'

import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { toast } from 'sonner'

interface Client {
  id: string
  matricule: string
  nom: string
  telephone: string
  solde: number
  totalDepots: number
  totalRetraits: number
}

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preselectedClient?: Client | null
}

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  preselectedClient
}: TransactionModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientList, setShowClientList] = useState(false)
  const [formData, setFormData] = useState({
    type: 'depot' as 'depot' | 'retrait',
    montant: '',
    description: '',
    sourceDestination: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      resetForm()
      
      // Si un client est présélectionné, l'utiliser
      if (preselectedClient) {
        setSelectedClient(preselectedClient)
        setShowClientList(false)
      } else {
        setShowClientList(true)
      }
    }
  }, [isOpen, preselectedClient])

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telephone.includes(searchTerm)
    )
    setFilteredClients(filtered)
  }, [searchTerm, clients])

  useEffect(() => {
    // Mettre à jour la source/destination par défaut selon le type
    if (formData.type === 'retrait' && (!formData.sourceDestination || formData.sourceDestination === 'Recette journalière')) {
      setFormData(prev => ({ ...prev, sourceDestination: 'Retrait espèces' }))
    } else if (formData.type === 'depot' && (!formData.sourceDestination || formData.sourceDestination === 'Retrait espèces')) {
      setFormData(prev => ({ ...prev, sourceDestination: 'Recette journalière' }))
    }
  }, [formData.type])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
        setFilteredClients(data)
      } else {
        toast.error('Erreur lors du chargement des clients')
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des clients')
    }
  }

  const resetForm = () => {
    setSelectedClient(null)
    setSearchTerm('')
    setShowClientList(false)
    setFormData({
      type: 'depot',
      montant: '',
      description: '',
      sourceDestination: ''
    })
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setSearchTerm('')
    setShowClientList(false)
  }

  const handleClientDeselect = () => {
    setSelectedClient(null)
    setSearchTerm('')
    setShowClientList(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client')
      return
    }

    const montant = parseFloat(formData.montant)
    if (isNaN(montant) || montant <= 0) {
      toast.error('Veuillez saisir un montant valide')
      return
    }

    if (formData.type === 'retrait' && montant > selectedClient.solde) {
      toast.error('Solde insuffisant pour ce retrait')
      return
    }

    if (!formData.sourceDestination.trim()) {
      toast.error('Veuillez saisir la source/destination')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          type: formData.type,
          montant,
          description: formData.description.trim() || null,
          sourceDestination: formData.sourceDestination.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Transaction enregistrée avec succès')
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Nouvelle Transaction
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            
            {selectedClient ? (
              // Client sélectionné
              <div className="relative p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <button
                  type="button"
                  onClick={handleClientDeselect}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
                <div className="pr-8">
                  <div className="font-medium text-gray-900">{selectedClient.nom}</div>
                  <div className="text-sm text-gray-600">
                    {selectedClient.matricule} • Solde: {formatCurrency(selectedClient.solde)}
                  </div>
                </div>
              </div>
            ) : (
              // Barre de recherche
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowClientList(true)
                    }}
                    onFocus={() => setShowClientList(true)}
                  />
                </div>
                
                {showClientList && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredClients.length === 0 ? (
                      <div className="p-3 text-gray-500 text-center">
                        Aucun client trouvé
                      </div>
                    ) : (
                      filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleClientSelect(client)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium text-gray-900">{client.nom}</div>
                          <div className="text-sm text-gray-600">
                            {client.matricule} • {formatCurrency(client.solde)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transaction Type Switch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de transaction
            </label>
            <div className="relative inline-flex w-full">
              <div className="flex w-full bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'depot' }))}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    formData.type === 'depot'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  💰 Dépôt
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'retrait' }))}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                    formData.type === 'retrait'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  💸 Retrait
                </button>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="montant" className="block text-sm font-medium text-gray-700 mb-1">
              Montant (FCFA)
            </label>
            <input
              type="number"
              id="montant"
              min="1"
              step="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              value={formData.montant}
              onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
              placeholder="0"
            />
          </div>

          {/* Source/Destination */}
          <div>
            <label htmlFor="sourceDestination" className="block text-sm font-medium text-gray-700 mb-1">
              {formData.type === 'depot' ? 'Source du dépôt' : 'Destination du retrait'}
            </label>
            <input
              type="text"
              id="sourceDestination"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              value={formData.sourceDestination}
              onChange={(e) => setFormData(prev => ({ ...prev, sourceDestination: e.target.value }))}
              placeholder={formData.type === 'depot' ? 'Ex: Recette journalière, Virement...' : 'Ex: Retrait espèces, Transfert...'}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              id="description"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Détails supplémentaires..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !selectedClient}
              className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'En cours...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}