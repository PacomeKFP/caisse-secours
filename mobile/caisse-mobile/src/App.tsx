import { useState } from 'react'
import ClientsList from './components/ClientsList'
import ClientTransactions from './components/ClientTransactions'
import type { Client } from './types'
import './App.css'

function App() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  return (
    <div className="app">
      {!selectedClient ? (
        <ClientsList onSelectClient={setSelectedClient} />
      ) : (
        <ClientTransactions 
          client={selectedClient} 
          onBack={() => setSelectedClient(null)} 
        />
      )}
    </div>
  )
}

export default App
