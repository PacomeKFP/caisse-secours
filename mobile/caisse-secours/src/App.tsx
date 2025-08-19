import { useState } from 'react'
import ClientsList from './components/ClientsList'
import ClientTransactions from './components/ClientTransactions'
import AddTransactionModal from './components/AddTransactionModal'
import type { Client } from './types'
import { saveTransaction } from './lib/storage'
import './App.css'

function App() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionClient, setTransactionClient] = useState<Client | null>(null)

  const handleAddTransaction = (client: Client) => {
    setTransactionClient(client)
    setShowTransactionModal(true)
  }

  const handleSaveTransaction = (transactionData: {
    type: 'depot' | 'retrait'
    montant: number
    description?: string
    sourceDestination: string
  }) => {
    if (transactionClient) {
      saveTransaction({
        ...transactionData,
        clientId: transactionClient.id
      })
      setShowTransactionModal(false)
      setTransactionClient(null)
    }
  }

  return (
    <div className="app">
      {!selectedClient ? (
        <ClientsList 
          onSelectClient={setSelectedClient}
          onAddTransaction={handleAddTransaction}
        />
      ) : (
        <ClientTransactions 
          client={selectedClient} 
          onBack={() => setSelectedClient(null)} 
        />
      )}

      {showTransactionModal && transactionClient && (
        <AddTransactionModal
          clientName={transactionClient.nom}
          onSave={handleSaveTransaction}
          onClose={() => {
            setShowTransactionModal(false)
            setTransactionClient(null)
          }}
        />
      )}
    </div>
  )
}

export default App
