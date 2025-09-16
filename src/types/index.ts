export interface User {
  id: string
  username: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface TransactionFormData {
  id?: string
  clientId: string
  type: 'depot' | 'retrait'
  montant: number
  description?: string
  sourceDestination: string
}

export interface ClientFormData {
  matricule: string
  nom: string
  telephone: string
}

export interface CommissionCalculation {
  clientId: string
  nom: string
  soldeBase: number
  commission: number
  tranches: {
    montantMin: number
    montantMax: number | null
    taux: number
    montantTranche: number
    commissionTranche: number
  }[]
}

// Format standard d'interopérabilité pour tous les exports/imports
export interface StandardExportFormat {
  clients?: any[]
  transactions?: any[]
  commissions?: any[]
  metadata?: {
    exportDate: string
    source: 'web' | 'mobile'
    version: string
    total: number
  }
}

// Type pour détection automatique du format
export type ImportFormat = StandardExportFormat | any[]