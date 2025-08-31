import { useState } from 'react'
import ClientsList from './components/ClientsList'
import ClientTransactions from './components/ClientTransactions'
import AddTransactionModal from './components/AddTransactionModal'
import BottomNavigation from './components/BottomNavigation'
import Dashboard from './components/Dashboard'
import Synchronization from './components/Synchronization'
import type { Client, TabType } from './types'
import { saveTransaction } from './lib/storage'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
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

  const renderContent = () => {
    if (selectedClient) {
      return (
        <ClientTransactions
          client={selectedClient}
          onBack={() => setSelectedClient(null)}
        />
      )
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'clients':
        return (
          <ClientsList
            onSelectClient={setSelectedClient}
            onAddTransaction={handleAddTransaction}
          />
        )
      case 'sync':
        return <Synchronization />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="app">
      {renderContent()}

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

      {!selectedClient && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  )
}

export default App
