import { useState } from 'react'

interface AddTransactionModalProps {
  clientName: string
  onSave: (transaction: {
    type: 'depot' | 'retrait'
    montant: number
    description?: string
    sourceDestination: string
  }) => void
  onClose: () => void
}

export default function AddTransactionModal({ clientName, onSave, onClose }: AddTransactionModalProps) {
  const [type, setType] = useState<'depot' | 'retrait'>('depot')
  const [montant, setMontant] = useState('')
  const [description, setDescription] = useState('')
  const [sourceDestination, setSourceDestination] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(montant)
    
    if (!amount || amount <= 0) {
      alert('Le montant doit être supérieur à 0')
      return
    }

    if (!sourceDestination.trim()) {
      alert('La source/destination est requise')
      return
    }

    onSave({
      type,
      montant: amount,
      description: description.trim() || undefined,
      sourceDestination: sourceDestination.trim()
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Nouvelle transaction</h2>
        <p style={{ color: '#86868b', marginBottom: '1rem' }}>Client: {clientName}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type de transaction</label>
            <select value={type} onChange={e => setType(e.target.value as 'depot' | 'retrait')}>
              <option value="depot">Dépôt</option>
              <option value="retrait">Retrait</option>
            </select>
          </div>

          <div className="form-group">
            <label>Montant (FCFA)</label>
            <input
              type="number"
              value={montant}
              onChange={e => setMontant(e.target.value)}
              placeholder="Ex: 50000"
              min="1"
              step="1"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Source/Destination</label>
            <input
              type="text"
              value={sourceDestination}
              onChange={e => setSourceDestination(e.target.value)}
              placeholder={type === 'depot' ? 'Ex: Espèces, Virement' : 'Ex: Retrait espèces'}
            />
          </div>

          <div className="form-group">
            <label>Description (optionnel)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Épargne mensuelle"
              rows={2}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}