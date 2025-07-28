'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
// Import types only to avoid server-side execution
interface CommissionService {
  getCurrentMonth(): string
  formatMoisAnnee(monthStr: string): string
}

interface CommissionCalculation {
  clientId: string
  nom: string
  matricule: string
  soldeBase: number
  commission: number
  tranche: {
    montantMin: number
    montantMax: number | null
    montant: number
  } | null
}

interface CommissionCollectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CommissionCollectModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CommissionCollectModalProps) {
  const [selectedMonth, setSelectedMonth] = useState('')
  const [preview, setPreview] = useState<CommissionCalculation[]>([])
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [step, setStep] = useState<'select' | 'preview' | 'confirm'>('select')

  useEffect(() => {
    if (isOpen) {
      // Set current month as default
      const now = new Date()
      const year = now.getFullYear()
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const currentMonth = `${year}-${month}`
      setSelectedMonth(currentMonth)
      setStep('select')
      setPreview([])
    }
  }, [isOpen])

  const handlePreview = async () => {
    if (!selectedMonth) {
      toast.error('Veuillez sélectionner un mois')
      return
    }

    setPreviewLoading(true)

    try {
      const response = await fetch('/api/commissions/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moisAnnee: selectedMonth })
      })

      const data = await response.json()

      if (response.ok) {
        setPreview(data)
        setStep('preview')
      } else {
        toast.error(data.error || 'Erreur lors de la prévisualisation')
      }
    } catch (error) {
      toast.error('Erreur lors de la prévisualisation')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleCollect = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/commissions/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moisAnnee: selectedMonth })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Commissions collectées avec succès ! ${data.collectees} clients traités pour un total de ${data.totalCommission.toLocaleString()} FCFA`)
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Erreur lors de la collecte')
      }
    } catch (error) {
      toast.error('Erreur lors de la collecte')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA'
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    return `${months[parseInt(month) - 1]} ${year}`
  }

  const getTotalCommission = () => {
    return preview.reduce((sum, calc) => sum + calc.commission, 0)
  }

  const generateMonthOptions = () => {
    const options = []
    const now = new Date()
    
    // Current month and previous 6 months
    for (let i = 0; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const value = `${year}-${month}`
      const label = formatMonth(value)
      
      options.push({ value, label })
    }
    
    return options
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Collecte des Commissions Mensuelles
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 'select' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Sélection du Mois</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choisissez le mois pour lequel vous souhaitez collecter les commissions.
                </p>
              </div>

              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                  Mois de collecte
                </label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  <option value="">Sélectionnez un mois</option>
                  {generateMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-yellow-800 font-medium">Attention</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      La collecte des commissions est une opération critique. Une fois lancée, elle ne peut pas être annulée. 
                      Assurez-vous que tous les dépôts et retraits du mois sont enregistrés avant de procéder.
                    </p>
                  </div>
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
                  type="button"
                  onClick={handlePreview}
                  disabled={!selectedMonth || previewLoading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {previewLoading ? 'Calcul...' : 'Prévisualiser'}
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">
                  Prévisualisation - {formatMonth(selectedMonth)}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Vérifiez les calculs avant de confirmer la collecte des commissions.
                </p>
              </div>

              {preview.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <CheckCircle size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commission à collecter</h3>
                  <p className="text-gray-600">
                    Aucun client n&apos;a de solde positif nécessitant une commission pour ce mois.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-green-800 font-medium">Résumé de la collecte</h4>
                        <p className="text-green-700 text-sm">
                          {preview.length} client(s) • Total: {formatCurrency(getTotalCommission())}
                        </p>
                      </div>
                      <CheckCircle className="text-green-600" size={24} />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Client</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900">Solde Base</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900">Commission</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Tranche Appliquée</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {preview.map((calc) => (
                          <tr key={calc.clientId} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-gray-900">{calc.nom}</div>
                                <div className="text-sm text-gray-600">{calc.matricule}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              {formatCurrency(calc.soldeBase)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-green-600">
                              {formatCurrency(calc.commission)}
                            </td>
                            <td className="py-3 px-4">
                              {calc.tranche ? (
                                <div className="text-xs">
                                  <div className="flex justify-between">
                                    <span>
                                      {calc.tranche.montantMin.toLocaleString()}-{calc.tranche.montantMax?.toLocaleString() || '∞'} FCFA
                                    </span>
                                    <span className="font-medium">
                                      {calc.tranche.montant.toLocaleString()} FCFA fixe
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs">Aucune tranche applicable</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Retour
                </button>
                {preview.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep('confirm')}
                    className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
                  >
                    Confirmer la collecte
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Confirmation de Collecte</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Êtes-vous sûr de vouloir procéder à la collecte des commissions ?
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-red-800 font-medium">Action Irréversible</h4>
                    <p className="text-red-700 text-sm mt-1">
                      Cette action créera {preview.length} enregistrement(s) de commission pour un total de {formatCurrency(getTotalCommission())}. 
                      Cette opération ne peut pas être annulée.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('preview')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={handleCollect}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Collecte en cours...' : 'Confirmer et Collecter'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}