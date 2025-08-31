import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { createId } from '@paralleldrive/cuid2'

// Clients table - solde removed (calculated dynamically)
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  matricule: text('matricule').notNull().unique(),
  nom: text('nom').notNull(),
  telephone: text('telephone').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

// Transactions table
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['depot', 'retrait'] }).notNull(),
  montant: real('montant').notNull(),
  description: text('description'),
  sourceDestination: text('source_destination').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

// Commissions table
export const commissions = sqliteTable('commissions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  montantTotal: real('montant_total').notNull(),
  commission: real('commission').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(),
  moisAnnee: text('mois_annee').notNull(), // Format: "2025-01"
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

// Commission configuration table
export const commissionConfig = sqliteTable('commission_config', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  montantMin: real('montant_min').notNull(),
  montantMax: real('montant_max'),
  montant: real('montant').notNull(), // Fixed amount for this tranche
  ordre: integer('ordre').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

// Table des prêts
export const prets = sqliteTable('prets', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  montant: real('montant').notNull(),
  montantRestant: real('montant_restant').notNull(), // Calculé automatiquement
  datePret: text('date_pret').notNull(),
  statut: text('statut', { enum: ['actif', 'rembourse'] }).default('actif'),
  description: text('description'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

// Table des remboursements
export const remboursements = sqliteTable('remboursements', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  pretId: text('pret_id').notNull().references(() => prets.id, { onDelete: 'cascade' }),
  montant: real('montant').notNull(),
  dateRemboursement: text('date_remboursement').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Commission = typeof commissions.$inferSelect
export type NewCommission = typeof commissions.$inferInsert
export type CommissionConfig = typeof commissionConfig.$inferSelect
export type NewCommissionConfig = typeof commissionConfig.$inferInsert
export type Pret = typeof prets.$inferSelect
export type NewPret = typeof prets.$inferInsert
export type Remboursement = typeof remboursements.$inferSelect
export type NewRemboursement = typeof remboursements.$inferInsert