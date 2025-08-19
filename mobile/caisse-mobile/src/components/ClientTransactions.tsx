import { useState, useEffect } from 'react'
import type { Client, Transaction } from '../types'
import { getTransactions, saveTransaction } from '../lib/storage'
import AddTransactionModal from './AddTransactionModal'

interface ClientTransactionsProps {
  client: Client
  onBack: () => void
}

export default function ClientTransactions({ client, onBack }: ClientTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    setTransactions(getTransactions(client.id))
  }, [client.id])

  const handleAddTransaction = (transactionData: {
    type: 'depot' | 'retrait'
    montant: number
    description?: string
    sourceDestination: string
  }) => {
    const newTransaction = saveTransaction({
      ...transactionData,
      clientId: client.id
    })
    setTransactions(prev => [newTransaction, ...prev])
    setShowAddModal(false)
  }

  const formatAmount = (amount: number, type: 'depot' | 'retrait') => {
    const formatted = amount.toLocaleString('fr-FR')
    return type === 'depot' ? `+${formatted} FCFA` : `-${formatted} FCFA`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateBalance = () => {
    return transactions.reduce((acc, t) => {
      return t.type === 'depot' ? acc + t.montant : acc - t.montant
    }, 0)
  }

  const balance = calculateBalance()

  return (
    <>
      <div className="header">
        <button className="back-btn" onClick={onBack}>
          ←
        </button>
        <div>
          <h1>{client.nom}</h1>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Solde: <span style={{ 
              fontWeight: 'bold', 
              color: balance >= 0 ? '#28a745' : '#dc3545' 
            }}>
              {balance.toLocaleString('fr-FR')} FCFA
            </span>
          </p>
        </div>
      </div>
      
      <div className="content">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <h3>Aucune transaction</h3>
            <p>Ajoutez la première transaction pour {client.nom}</p>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
              Transactions ({transactions.length})
            </h2>
            {transactions.map(transaction => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-info">
                  <h4>
                    {transaction.sourceDestination}
                  </h4>
                  <p>{formatDate(transaction.createdAt)}</p>
                  {transaction.description && (
                    <p style={{ fontStyle: 'italic' }}>{transaction.description}</p>
                  )}
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {formatAmount(transaction.montant, transaction.type)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => setShowAddModal(true)}>
        +
      </button>

      {showAddModal && (
        <AddTransactionModal
          clientName={client.nom}
          onSave={handleAddTransaction}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  )
}