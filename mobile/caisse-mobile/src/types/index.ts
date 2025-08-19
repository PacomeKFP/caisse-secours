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
    matricule: string
    nom: string
    telephone: string
    createdAt?: string
  }>
}