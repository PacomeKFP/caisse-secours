import { useState } from 'react'
import { getTransactionsForExport } from '../lib/storage'

interface ExportModalProps {
  onExport: (fromDate: string, toDate: string) => void
  onClose: () => void
  lastExportDate?: string
}

export default function ExportModal({ onExport, onClose, lastExportDate }: ExportModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const defaultFromDate = lastExportDate 
    ? new Date(lastExportDate).toISOString().split('T')[0]
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 jours
  
  const [fromDate, setFromDate] = useState(defaultFromDate)
  const [toDate, setToDate] = useState(today)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fromDate || !toDate) {
      alert('Les deux dates sont requises')
      return
    }

    if (fromDate > toDate) {
      alert('La date de début doit être antérieure à la date de fin')
      return
    }

    // Vérifier s'il y a des transactions à exporter
    const exportData = getTransactionsForExport(fromDate, toDate + 'T23:59:59.999Z')
    
    if (exportData.transactions.length === 0) {
      alert('Aucune nouvelle transaction trouvée pour cette période')
      return
    }

    onExport(fromDate, toDate + 'T23:59:59.999Z')
  }

  const previewCount = getTransactionsForExport(fromDate, toDate + 'T23:59:59.999Z').transactions.length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Export des transactions</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date de début</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              max={today}
            />
          </div>

          <div className="form-group">
            <label>Date de fin</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              max={today}
              min={fromDate}
            />
          </div>

          <div style={{ 
            background: '#f2f2f7', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem' 
          }}>
            <p style={{ fontSize: '0.9rem', color: '#1d1d1f' }}>
              <strong>{previewCount}</strong> nouvelles transactions seront exportées
            </p>
            {lastExportDate && (
              <p style={{ fontSize: '0.85rem', color: '#86868b', marginTop: '0.5rem' }}>
                Exporte uniquement les transactions créées après le {new Date(lastExportDate).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn" disabled={previewCount === 0}>
              Exporter ({previewCount})
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}