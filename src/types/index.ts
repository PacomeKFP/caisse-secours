export interface User {
  id: string
  username: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface TransactionFormData {
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