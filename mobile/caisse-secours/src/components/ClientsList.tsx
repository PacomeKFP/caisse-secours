import { useState, useEffect } from 'react'
import type { Client, ImportClientsData, StandardExportFormat } from '../types'
import { getClientsWithBalance, saveClient, getTransactionsForExport, updateExportRecord, getExportRecord, importClients } from '../lib/storage'
import { exportToDocuments, generateFileName, ensureExportDirectory } from '../lib/fileExport'
import AddClientModal from './AddClientModal'
import ExportModal from './ExportModal'
import ImportModal from './ImportModal'

interface ClientsListProps {
  onSelectClient: (client: Client) => void
  onAddTransaction: (client: Client) => void
}

export default function ClientsList({ onSelectClient, onAddTransaction }: ClientsListProps) {
  const [clients, setClients] = useState<(Client & { solde: number })[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    setClients(getClientsWithBalance())
    ensureExportDirectory() // Créer le dossier d'export au démarrage
  }, [])

  const handleAddClient = (clientData: { matricule: string; nom: string; telephone: string }) => {
    saveClient(clientData)
    setClients(getClientsWithBalance())
    setShowAddModal(false)
  }

  const handleExport = async (fromDate: string, toDate: string) => {
    const rawData = getTransactionsForExport(fromDate, toDate)
    
    if (rawData.transactions.length === 0) {
      alert('Aucune nouvelle transaction à exporter')
      return
    }

    // Format standard interopérable
    const standardFormat: StandardExportFormat = {
      transactions: rawData.transactions,
      metadata: {
        exportDate: new Date().toISOString(),
        source: 'mobile' as const,
        version: '1.0.0',
        total: rawData.transactions.length
      }
    }

    // Exporter avec le nouveau système de fichiers
    const filename = generateFileName('CaisseSecours', 'Transactions')
    const result = await exportToDocuments(standardFormat, filename)
    
    if (result.success) {
      // Mettre à jour le record d'export
      updateExportRecord(toDate)
      setShowExportModal(false)
      alert(`✅ Export réussi !\n\n${rawData.transactions.length} transactions exportées\n\nFichier: ${result.path}`)
    } else {
      alert(`❌ Erreur d'export:\n${result.error}`)
    }
  }

  const handleImport = (data: ImportClientsData) => {
    const result = importClients(data.clients)
    
    if (result.errors.length > 0) {
      alert(`Import terminé avec erreurs:\n- Importés: ${result.imported}\n- Ignorés: ${result.skipped}\n- Erreurs: ${result.errors.length}\n\n${result.errors.slice(0, 5).join('\n')}`)
    } else {
      alert(`Import réussi:\n- Importés: ${result.imported}\n- Ignorés (doublons): ${result.skipped}`)
    }
    
    setClients(getClientsWithBalance())
    setShowImportModal(false)
  }

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase()
    return client.nom.toLowerCase().includes(searchLower) ||
           client.matricule.toLowerCase().includes(searchLower) ||
           client.telephone.includes(searchTerm)
  })

  const lastExport = getExportRecord()

  return (
    <>
      <div className="header">
        <h1>Caisse Secours Collecte</h1>
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

        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Rechercher par nom, matricule ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '8px',
              fontSize: '1rem',
              backgroundColor: '#ffffff',
              color: '#1d1d1f',
              colorScheme: 'light'
            }}
          />
        </div>

        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <h3>{searchTerm ? 'Aucun client trouvé' : 'Aucun client'}</h3>
            <p>{searchTerm ? 'Aucun client ne correspond à votre recherche' : 'Importez des clients pour commencer'}</p>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Clients ({filteredClients.length})</h2>
            {filteredClients.map(client => (
              <div key={client.id} className="card" onClick={() => onSelectClient(client)}>
                <h3>{client.nom}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <div>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>{client.telephone}</p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#999' }}>{client.matricule}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      color: client.solde >= 0 ? '#28a745' : '#dc3545',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: client.solde >= 0 ? '#d4edda' : '#f8d7da',
                      borderRadius: '4px'
                    }}>
                      {client.solde.toLocaleString('fr-FR')} FCFA
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddTransaction(client)
                      }}
                      style={{
                        backgroundColor: '#007AFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      Nouvelle transaction
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


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