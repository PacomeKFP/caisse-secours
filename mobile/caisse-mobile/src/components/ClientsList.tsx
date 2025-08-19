import { useState, useEffect } from 'react'
import type { Client, ImportClientsData } from '../types'
import { getClients, saveClient, getTransactionsForExport, updateExportRecord, getExportRecord, importClients } from '../lib/storage'
import AddClientModal from './AddClientModal'
import ExportModal from './ExportModal'
import ImportModal from './ImportModal'

interface ClientsListProps {
  onSelectClient: (client: Client) => void
}

export default function ClientsList({ onSelectClient }: ClientsListProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    setClients(getClients())
  }, [])

  const handleAddClient = (clientData: { matricule: string; nom: string; telephone: string }) => {
    const newClient = saveClient(clientData)
    setClients(prev => [...prev, newClient])
    setShowAddModal(false)
  }

  const handleExport = (fromDate: string, toDate: string) => {
    const exportData = getTransactionsForExport(fromDate, toDate)
    
    if (exportData.transactions.length === 0) {
      alert('Aucune nouvelle transaction à exporter')
      return
    }

    // Créer et télécharger le fichier JSON au format compatible
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-mobile-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Mettre à jour le record d'export
    updateExportRecord(toDate)
    setShowExportModal(false)
    alert(`${exportData.transactions.length} transactions exportées`)
  }

  const handleImport = (data: ImportClientsData) => {
    const result = importClients(data.clients)
    
    if (result.errors.length > 0) {
      alert(`Import terminé avec erreurs:\n- Importés: ${result.imported}\n- Ignorés: ${result.skipped}\n- Erreurs: ${result.errors.length}\n\n${result.errors.slice(0, 5).join('\n')}`)
    } else {
      alert(`Import réussi:\n- Importés: ${result.imported}\n- Ignorés (doublons): ${result.skipped}`)
    }
    
    setClients(getClients())
    setShowImportModal(false)
  }

  const lastExport = getExportRecord()

  return (
    <>
      <div className="header">
        <h1>Caisse Mobile</h1>
      </div>
      
      <div className="content">
        <div className="export-section">
          <h3>Import / Export</h3>
          {lastExport && (
            <p style={{ fontSize: '0.85rem', color: '#86868b', marginBottom: '1rem' }}>
              Dernier export: {new Date(lastExport.lastExportDate).toLocaleDateString('fr-FR')}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => setShowImportModal(true)}>
              Importer clients
            </button>
            <button className="btn btn-secondary" onClick={() => setShowExportModal(true)}>
              Exporter transactions
            </button>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="empty-state">
            <h3>Aucun client</h3>
            <p>Ajoutez votre premier client pour commencer</p>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Clients ({clients.length})</h2>
            {clients.map(client => (
              <div key={client.id} className="card" onClick={() => onSelectClient(client)}>
                <h3>{client.nom}</h3>
                <p>{client.telephone}</p>
                <p>{client.matricule}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => setShowAddModal(true)}>
        +
      </button>

      {showAddModal && (
        <AddClientModal
          onSave={handleAddClient}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showExportModal && (
        <ExportModal
          onExport={handleExport}
          onClose={() => setShowExportModal(false)}
          lastExportDate={lastExport?.lastExportDate}
        />
      )}

      {showImportModal && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </>
  )
}