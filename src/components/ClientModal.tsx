'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Client {
  id?: string
  matricule: string
  nom: string
  telephone: string
}

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  client?: Client | null
  mode: 'create' | 'edit'
}

export default function ClientModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  client, 
  mode 
}: ClientModalProps) {
  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    telephone: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && client) {
        setFormData({
          matricule: client.matricule,
          nom: client.nom,
          telephone: client.telephone
        })
      } else {
        // Generate matricule for new client
        generateMatricule()
        setFormData({
          matricule: '',
          nom: '',
          telephone: ''
        })
      }
    }
  }, [isOpen, mode, client])

  const generateMatricule = async () => {
    try {
      const response = await fetch('/api/clients/generate-matricule')
      const data = await response.json()
      setFormData(prev => ({ ...prev, matricule: data.matricule }))
    } catch (error) {
      console.error('Error generating matricule:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = mode === 'create' 
        ? '/api/clients' 
        : `/api/clients/${client?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          mode === 'create' 
            ? 'Client créé avec succès' 
            : 'Client modifié avec succès'
        )
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Erreur lors de l\'opération')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'opération')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'Nouveau Client' : 'Modifier Client'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="matricule" className="block text-sm font-medium text-gray-700 mb-1">
              Matricule
            </label>
            <input
              type="text"
              id="matricule"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              value={formData.matricule}
              onChange={(e) => setFormData(prev => ({ ...prev, matricule: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              id="nom"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              value={formData.nom}
              onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              id="telephone"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              value={formData.telephone}
              onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'En cours...' : (mode === 'create' ? 'Créer' : 'Modifier')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}