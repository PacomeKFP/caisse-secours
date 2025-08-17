import { db, clients, transactions, Transaction, NewTransaction } from '@/lib/db'
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm'
import { ClientService } from './clientService'

export class TransactionService {
  static async createTransaction(transactionData: Omit<NewTransaction, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Check if client exists
      const client = await db
        .select()
        .from(clients)
        .where(eq(clients.id, transactionData.clientId))
        .limit(1)

      if (client.length === 0) {
        throw new Error('Client non trouvé')
      }

      // For withdrawals, check current balance
      if (transactionData.type === 'retrait') {
        const currentBalance = await ClientService.calculateClientBalance(transactionData.clientId)
        if (currentBalance < transactionData.montant) {
          throw new Error('Solde insuffisant pour ce retrait')
        }
      }

      // Create transaction (no need to update balance as it's calculated dynamically)
      const newTransaction = await db
        .insert(transactions)
        .values(transactionData)
        .returning()

      return newTransaction[0]
    } catch (error) {
      console.error('Erreur lors de la création de la transaction:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Erreur lors de la création de la transaction')
    }
  }

  // Method to create transaction within an existing database transaction
  static async createTransactionInTx(tx: any, transactionData: Omit<NewTransaction, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Check if client exists
      const client = await tx
        .select()
        .from(clients)
        .where(eq(clients.id, transactionData.clientId))
        .limit(1)

      if (client.length === 0) {
        throw new Error('Client non trouvé')
      }

      // For withdrawals, check current balance (but skip for commission withdrawals from system)
      if (transactionData.type === 'retrait' && transactionData.sourceDestination !== 'Système de Commission') {
        const currentBalance = await ClientService.calculateClientBalance(transactionData.clientId)
        if (currentBalance < transactionData.montant) {
          throw new Error('Solde insuffisant pour ce retrait')
        }
      }

      // Create transaction within the transaction
      const newTransaction = await tx
        .insert(transactions)
        .values(transactionData)
        .returning()

      return newTransaction[0]
    } catch (error) {
      console.error('Erreur lors de la création de la transaction:', error)
      throw error
    }
  }

  static async getAllTransactions(page = 1, limit = 50, filters?: {
    clientId?: string
    type?: 'depot' | 'retrait'
    startDate?: string
    endDate?: string
  }) {
    try {
      // Build conditions
      const conditions = []
      if (filters?.clientId) {
        conditions.push(eq(transactions.clientId, filters.clientId))
      }
      if (filters?.type) {
        conditions.push(eq(transactions.type, filters.type))
      }
      if (filters?.startDate) {
        conditions.push(gte(transactions.createdAt, filters.startDate))
      }
      if (filters?.endDate) {
        conditions.push(lte(transactions.createdAt, filters.endDate))
      }

      // Build query with or without filters
      const query = db
        .select({
          id: transactions.id,
          clientId: transactions.clientId,
          type: transactions.type,
          montant: transactions.montant,
          description: transactions.description,
          sourceDestination: transactions.sourceDestination,
          createdAt: transactions.createdAt,
          clientNom: clients.nom,
          clientMatricule: clients.matricule
        })
        .from(transactions)
        .leftJoin(clients, eq(transactions.clientId, clients.id))
        .$dynamic()

      // Apply conditions if any
      const finalQuery = conditions.length > 0 
        ? query.where(and(...conditions))
        : query

      const offset = (page - 1) * limit
      const result = await finalQuery
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset)

      return result
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw new Error('Failed to fetch transactions')
    }
  }

  static async getClientTransactions(clientId: string) {
    try {
      const result = await db
        .select()
        .from(transactions)
        .where(eq(transactions.clientId, clientId))
        .orderBy(desc(transactions.createdAt))

      return result
    } catch (error) {
      console.error('Error fetching client transactions:', error)
      throw new Error('Failed to fetch client transactions')
    }
  }

  static async getTransactionById(id: string) {
    try {
      const result = await db
        .select({
          id: transactions.id,
          clientId: transactions.clientId,
          type: transactions.type,
          montant: transactions.montant,
          description: transactions.description,
          sourceDestination: transactions.sourceDestination,
          createdAt: transactions.createdAt,
          clientNom: clients.nom,
          clientMatricule: clients.matricule
        })
        .from(transactions)
        .leftJoin(clients, eq(transactions.clientId, clients.id))
        .where(eq(transactions.id, id))
        .limit(1)

      return result[0] || null
    } catch (error) {
      console.error('Error fetching transaction:', error)
      throw new Error('Failed to fetch transaction')
    }
  }

  static async getMonthlyStats(year: number, month: number) {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString()
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

      const stats = await db
        .select({
          type: transactions.type,
          total: sql<number>`SUM(${transactions.montant})`,
          count: sql<number>`COUNT(*)`
        })
        .from(transactions)
        .where(and(
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate)
        ))
        .groupBy(transactions.type)

      const result = {
        depots: { total: 0, count: 0 },
        retraits: { total: 0, count: 0 }
      }

      stats.forEach(stat => {
        if (stat.type === 'depot') {
          result.depots = { total: stat.total, count: stat.count }
        } else if (stat.type === 'retrait') {
          result.retraits = { total: stat.total, count: stat.count }
        }
      })

      return result
    } catch (error) {
      console.error('Error fetching monthly stats:', error)
      throw new Error('Failed to fetch monthly stats')
    }
  }

  static async deleteTransaction(id: string) {
    try {
      // Get transaction details
      const transaction = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1)

      if (transaction.length === 0) {
        throw new Error('Transaction non trouvée')
      }

      const transactionData = transaction[0]

      // For depot deletions, check if client would have sufficient balance after removal
      if (transactionData.type === 'depot') {
        const currentBalance = await ClientService.calculateClientBalance(transactionData.clientId)
        const balanceAfterDeletion = currentBalance - transactionData.montant
        
        if (balanceAfterDeletion < 0) {
          throw new Error('Impossible de supprimer ce dépôt - le solde deviendrait négatif')
        }
      }

      // Delete transaction (balance will be recalculated dynamically)
      await db
        .delete(transactions)
        .where(eq(transactions.id, id))

      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de la transaction:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Erreur lors de la suppression de la transaction')
    }
  }
}