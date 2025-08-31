import { useState, useEffect } from 'react'
import type { Client } from '../types'
import { getClientsWithBalance, saveClient } from '../lib/storage'
import AddClientModal from './AddClientModal'

interface ClientsListProps {
  onSelectClient: (client: Client) => void
  onAddTransaction: (client: Client) => void
}

export default function ClientsList({ onSelectClient, onAddTransaction }: ClientsListProps) {
  const [clients, setClients] = useState<(Client & { solde: number })[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    setClients(getClientsWithBalance())
  }, [])

  const handleAddClient = (clientData: { matricule: string; nom: string; telephone: string }) => {
    saveClient(clientData)
    setClients(getClientsWithBalance())
    setShowAddModal(false)
  }

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase()
    return client.nom.toLowerCase().includes(searchLower) ||
      client.matricule.toLowerCase().includes(searchLower) ||
      client.telephone.includes(searchTerm)
  })

  return (
    <div className="sync-page">
      <div className="sync-header">
        <h1>Collecte Journalière</h1>
        <p>Gérer la collecte journalière</p>
      </div>

      <div >
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
    </div>
  )
}