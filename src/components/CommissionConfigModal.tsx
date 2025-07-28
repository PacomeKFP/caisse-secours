'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface CommissionTranche {
  montantMin: number
  montantMax: number | null
  montant: number
  ordre: number
}

interface CommissionConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CommissionConfigModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CommissionConfigModalProps) {
  const [tranches, setTranches] = useState<CommissionTranche[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchConfig()
    }
  }, [isOpen])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/commissions/config')
      if (response.ok) {
        const data = await response.json()
        if (data.length === 0) {
          // Default configuration
          setTranches([
            { montantMin: 0, montantMax: 50000, montant: 1000, ordre: 1 },
            { montantMin: 50001, montantMax: 100000, montant: 2500, ordre: 2 },
            { montantMin: 100001, montantMax: 200000, montant: 5000, ordre: 3 },
            { montantMin: 200001, montantMax: null, montant: 10000, ordre: 4 }
          ])
        } else {
          setTranches(data)
        }
      } else {
        toast.error('Erreur lors du chargement de la configuration')
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de la configuration')
    }
  }

  const addTranche = () => {
    const lastTranche = tranches[tranches.length - 1]
    const newTranche: CommissionTranche = {
      montantMin: lastTranche ? (lastTranche.montantMax || 0) + 1 : 0,
      montantMax: null,
      montant: 0,
      ordre: tranches.length + 1
    }
    
    // Update last tranche to have a max if it was null
    if (lastTranche && lastTranche.montantMax === null) {
      const updatedTranches = [...tranches]
      updatedTranches[updatedTranches.length - 1] = {
        ...lastTranche,
        montantMax: newTranche.montantMin - 1
      }
      setTranches([...updatedTranches, newTranche])
    } else {
      setTranches([...tranches, newTranche])
    }
  }

  const removeTranche = (index: number) => {
    if (tranches.length <= 1) {
      toast.error('Il faut au moins une tranche')
      return
    }
    
    const newTranches = tranches.filter((_, i) => i !== index)
    // Re-order
    const reordered = newTranches.map((tranche, i) => ({
      ...tranche,
      ordre: i + 1
    }))
    
    // Make sure last tranche has null max
    if (reordered.length > 0) {
      reordered[reordered.length - 1].montantMax = null
    }
    
    setTranches(reordered)
  }

  const updateTranche = (index: number, field: keyof CommissionTranche, value: number | null) => {
    const newTranches = [...tranches]
    newTranches[index] = { ...newTranches[index], [field]: value }
    
    // Auto-adjust adjacent tranches
    if (field === 'montantMax' && value !== null && index < tranches.length - 1) {
      newTranches[index + 1].montantMin = value + 1
    }
    
    setTranches(newTranches)
  }

  const validateTranches = (): string | null => {
    if (tranches.length === 0) return 'Au moins une tranche est requise'
    
    for (let i = 0; i < tranches.length; i++) {
      const tranche = tranches[i]
      
      if (tranche.montantMin < 0) {
        return `Montant minimum invalide pour la tranche ${i + 1}`
      }
      
      if (tranche.montantMax !== null && tranche.montantMax <= tranche.montantMin) {
        return `Montant maximum invalide pour la tranche ${i + 1}`
      }
      
      if (tranche.montant < 0) {
        return `Montant de commission invalide pour la tranche ${i + 1}`
      }
      
      // Check for gaps
      if (i > 0 && tranches[i - 1].montantMax !== null && tranche.montantMin !== tranches[i - 1].montantMax! + 1) {
        return `Gap détecté entre les tranches ${i} et ${i + 1}`
      }
    }
    
    // Last tranche should have null max
    if (tranches[tranches.length - 1].montantMax !== null) {
      tranches[tranches.length - 1].montantMax = null
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateTranches()
    if (validationError) {
      toast.error(validationError)
      return
    }
    
    setLoading(true)

    try {
      const response = await fetch('/api/commissions/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tranches })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Configuration des commissions mise à jour')
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Configuration des Commissions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-2">Tranches de Commission</h3>
            <p className="text-sm text-gray-600 mb-4">
              Définissez les tranches de solde et leurs montants de commission fixes respectifs.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {tranches.map((tranche, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Montant Min (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tranche.montantMin}
                    onChange={(e) => updateTranche(index, 'montantMin', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Montant Max (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tranche.montantMax || ''}
                    onChange={(e) => updateTranche(index, 'montantMax', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder={index === tranches.length - 1 ? 'Illimité' : ''}
                    disabled={index === tranches.length - 1}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:bg-gray-100"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Montant Commission (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={tranche.montant}
                    onChange={(e) => updateTranche(index, 'montant', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => removeTranche(index)}
                    disabled={tranches.length <= 1}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Supprimer cette tranche"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={addTranche}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Plus size={16} />
              Ajouter une tranche
            </button>
          </div>

          {/* Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Aperçu de la configuration</h4>
            <div className="space-y-1 text-sm">
              {tranches.map((tranche, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {formatCurrency(tranche.montantMin)} - {tranche.montantMax ? formatCurrency(tranche.montantMax) : 'Illimité'} FCFA
                  </span>
                  <span className="font-medium">{formatCurrency(tranche.montant)} FCFA</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}