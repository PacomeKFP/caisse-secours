import type { Client, Transaction, ExportRecord } from '../types'

const STORAGE_KEYS = {
  CLIENTS: 'caisse_clients',
  TRANSACTIONS: 'caisse_transactions', 
  EXPORT_RECORD: 'caisse_export_record'
}

// Génération d'ID simple
export const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)

// Calculer le solde d'un client
const calculateClientBalance = (clientId: string): number => {
  const transactions = getTransactions(clientId)
  return transactions.reduce((acc, t) => {
    return t.type === 'depot' ? acc + t.montant : acc - t.montant
  }, 0)
}

// Clients
export const getClients = (): Client[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CLIENTS)
  return data ? JSON.parse(data) : []
}

// Clients avec solde calculé
export const getClientsWithBalance = (): (Client & { solde: number })[] => {
  const clients = getClients()
  return clients.map(client => ({
    ...client,
    solde: calculateClientBalance(client.id)
  }))
}

export const saveClient = (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client => {
  const clients = getClients()
  const newClient: Client = {
    ...client,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  clients.push(newClient)
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients))
  return newClient
}

// Transactions
export const getTransactions = (clientId?: string): Transaction[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
  const transactions = data ? JSON.parse(data) : []
  return clientId ? transactions.filter((t: Transaction) => t.clientId === clientId) : transactions
}

export const saveTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction => {
  const transactions = getTransactions()
  const newTransaction: Transaction = {
    ...transaction,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  transactions.push(newTransaction)
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions))
  return newTransaction
}

// Export tracking
export const getExportRecord = (): ExportRecord | null => {
  const data = localStorage.getItem(STORAGE_KEYS.EXPORT_RECORD)
  return data ? JSON.parse(data) : null
}

export const updateExportRecord = (date: string): void => {
  const record: ExportRecord = {
    lastExportDate: date,
    exportCount: (getExportRecord()?.exportCount || 0) + 1
  }
  localStorage.setItem(STORAGE_KEYS.EXPORT_RECORD, JSON.stringify(record))
}

// Export des nouvelles transactions au format compatible
export const getTransactionsForExport = (fromDate?: string, toDate?: string) => {
  const transactions = getTransactions()
  const lastExport = getExportRecord()?.lastExportDate
  
  const startDate = fromDate || lastExport || '2000-01-01'
  const endDate = toDate || new Date().toISOString()
  
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = t.createdAt
    return transactionDate > startDate && transactionDate <= endDate
  })
  
  // Retourner au format attendu par l'app principale
  return {
    transactions: filteredTransactions
  }
}

// Import de clients
export const importClients = (clientsData: Array<{ id?: string; matricule: string; nom: string; telephone: string; createdAt?: string; updatedAt?: string }>): { imported: number; skipped: number; errors: string[] } => {
  const existingClients = getClients()
  const existingIds = new Set(existingClients.map(c => c.id))
  const existingMatricules = new Set(existingClients.map(c => c.matricule))
  
  let imported = 0
  let skipped = 0
  const errors: string[] = []
  
  clientsData.forEach((clientData, index) => {
    try {
      if (!clientData.matricule || !clientData.nom || !clientData.telephone) {
        errors.push(`Ligne ${index + 1}: Champs requis manquants`)
        return
      }
      
      // Vérifier si le client existe déjà par ID ou matricule
      if ((clientData.id && existingIds.has(clientData.id)) || existingMatricules.has(clientData.matricule)) {
        skipped++
        return
      }
      
      // Utiliser l'ID fourni ou générer un nouveau si absent
      const clientId = clientData.id || generateId()
      
      // Parser les dates si elles sont formatées (format français vers ISO)
      let parsedCreatedAt = clientData.createdAt || new Date().toISOString()
      let parsedUpdatedAt = clientData.updatedAt || new Date().toISOString()
      
      // Si les dates sont au format français (dd/mm/yyyy hh:mm:ss), les convertir
      if (clientData.createdAt && clientData.createdAt.includes('/')) {
        try {
          const [datePart, timePart] = clientData.createdAt.split(', ')
          const [day, month, year] = datePart.split('/')
          const fullDateTime = timePart ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}` : `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`
          parsedCreatedAt = new Date(fullDateTime).toISOString()
        } catch {
          parsedCreatedAt = new Date().toISOString()
        }
      }
      
      if (clientData.updatedAt && clientData.updatedAt.includes('/')) {
        try {
          const [datePart, timePart] = clientData.updatedAt.split(', ')
          const [day, month, year] = datePart.split('/')
          const fullDateTime = timePart ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}` : `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`
          parsedUpdatedAt = new Date(fullDateTime).toISOString()
        } catch {
          parsedUpdatedAt = new Date().toISOString()
        }
      }
      
      const newClient: Client = {
        id: clientId,
        matricule: clientData.matricule,
        nom: clientData.nom,
        telephone: clientData.telephone,
        createdAt: parsedCreatedAt,
        updatedAt: parsedUpdatedAt
      }
      
      existingClients.push(newClient)
      existingIds.add(clientId)
      existingMatricules.add(clientData.matricule)
      imported++
      
    } catch (error) {
      errors.push(`Ligne ${index + 1}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  })
  
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(existingClients))
  
  return { imported, skipped, errors }
}