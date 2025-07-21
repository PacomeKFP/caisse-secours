import { z } from "zod"

export const ClientSchema = z.object({
  id: z.string().optional(),
  matricule: z.string().min(1, "Matricule is required"),
  nom: z.string().min(1, "Name is required"),
  telephone: z.string().min(1, "Phone is required"),
  solde: z.number().default(0),
})

export const TransactionSchema = z.object({
  id: z.string().optional(),
  montant: z.number().positive("Amount must be positive"),
  type: z.enum(["DEPOT", "RETRAIT"]),
  raison: z.string().optional(),
  clientId: z.string().min(1, "Client ID is required"),
})

export const CommissionCalculationSchema = z.object({
  mois: z.number().min(1).max(12),
  annee: z.number().min(2020),
  clientIds: z.array(z.string()).optional(),
})

export type Client = z.infer<typeof ClientSchema>
export type Transaction = z.infer<typeof TransactionSchema>
export type CommissionCalculation = z.infer<typeof CommissionCalculationSchema>

export interface Commission {
  id: string
  montantTotal: number
  montantCommission: number
  label: string
  dateCreation: Date
  dateModification: Date
  mois: number
  annee: number
  clientId: string
  client?: Client
}

export const COMMISSION_GRID = [
  { min: 0, max: 10000, rate: 0.02 },
  { min: 10001, max: 50000, rate: 0.035 },
  { min: 50001, max: Number.POSITIVE_INFINITY, rate: 0.05 },
]
