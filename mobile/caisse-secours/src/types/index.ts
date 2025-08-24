export interface Client {
  id: string
  matricule: string
  nom: string
  telephone: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  clientId: string
  type: 'depot' | 'retrait'
  montant: number
  description?: string
  sourceDestination: string
  createdAt: string
  updatedAt: string
}

export interface ExportRecord {
  lastExportDate: string
  exportCount: number
}

export interface ImportClientsData {
  clients: Array<{
    id: string
    matricule: string
    nom: string
    telephone: string
    createdAt?: string
    updatedAt?: string
    totalDepots?: number
    totalRetraits?: number
    totalCommissions?: number
    solde?: number
  }>
}

// Format standard d'interopérabilité mobile ↔ web
export interface StandardExportFormat {
  clients?: Client[]
  transactions?: Transaction[]
  commissions?: any[]
  metadata?: {
    exportDate: string
    source: 'web' | 'mobile'
    version: string
    total: number
  }
}