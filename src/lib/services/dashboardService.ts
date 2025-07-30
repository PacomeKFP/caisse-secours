import { db, clients, transactions, commissions } from '@/lib/db'
import { sql, eq, and, gte, lte, desc } from 'drizzle-orm'

export interface DashboardStats {
  totalClients: number
  nouveauxClients: number
  depotsMonth: number
  retraitsMonth: number
  commissionsLastMonth: number
  soldeTotal: number
}

export interface RecentTransaction {
  id: string
  type: 'depot' | 'retrait'
  montant: number
  clientNom: string
  clientMatricule: string
  createdAt: string
}

export interface TopClient {
  id: string
  nom: string
  matricule: string
  solde: number
}

export interface TransactionEvolution {
  date: string
  depots: number
  retraits: number
}

export class DashboardService {
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

      // Current month boundaries
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString()
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString()

      // Last month format for commissions
      const lastMonthStr = `${lastMonthYear}-${lastMonth.toString().padStart(2, '0')}`

      // Total clients
      const totalClientsResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(clients)

      // New clients this month
      const nouveauxClientsResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(clients)
        .where(and(
          gte(clients.createdAt, startOfMonth),
          lte(clients.createdAt, endOfMonth)
        ))

      // Total solde (calculated dynamically)
      const soldeTotalResult = await db
        .select({ 
          total: sql<number>`COALESCE(
            (SELECT SUM(CASE WHEN type = 'depot' THEN montant ELSE -montant END) FROM transactions), 
            0
          )` 
        })
        .from(sql`(SELECT 1)`)

      // Transactions this month
      const transactionsMonthResult = await db
        .select({
          type: transactions.type,
          total: sql<number>`COALESCE(SUM(montant), 0)`
        })
        .from(transactions)
        .where(and(
          gte(transactions.createdAt, startOfMonth),
          lte(transactions.createdAt, endOfMonth)
        ))
        .groupBy(transactions.type)

      // Commissions last month
      const commissionsLastMonthResult = await db
        .select({ total: sql<number>`COALESCE(SUM(commission), 0)` })
        .from(commissions)
        .where(eq(commissions.moisAnnee, lastMonthStr))

      // Process results - ensure numeric conversion
      const totalClients = Number(totalClientsResult[0]?.count) || 0
      const nouveauxClients = Number(nouveauxClientsResult[0]?.count) || 0
      const soldeTotal = Number(soldeTotalResult[0]?.total) || 0
      const commissionsLastMonth = Number(commissionsLastMonthResult[0]?.total) || 0

      let depotsMonth = 0
      let retraitsMonth = 0

      transactionsMonthResult.forEach(result => {
        if (result.type === 'depot') {
          depotsMonth = Number(result.total) || 0
        } else if (result.type === 'retrait') {
          retraitsMonth = Number(result.total) || 0
        }
      })

      return {
        totalClients,
        nouveauxClients,
        depotsMonth,
        retraitsMonth,
        commissionsLastMonth,
        soldeTotal
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw new Error('Failed to fetch dashboard stats')
    }
  }

  static async getRecentTransactions(limit = 5): Promise<RecentTransaction[]> {
    try {
      const result = await db
        .select({
          id: transactions.id,
          type: transactions.type,
          montant: transactions.montant,
          createdAt: transactions.createdAt,
          clientNom: clients.nom,
          clientMatricule: clients.matricule
        })
        .from(transactions)
        .leftJoin(clients, eq(transactions.clientId, clients.id))
        .orderBy(desc(transactions.createdAt))
        .limit(limit)

      return result.map(row => ({
        id: row.id,
        type: row.type,
        montant: Number(row.montant) || 0,
        clientNom: row.clientNom || 'Client supprimé',
        clientMatricule: row.clientMatricule || 'N/A',
        createdAt: row.createdAt
      }))
    } catch (error) {
      console.error('Error fetching recent transactions:', error)
      throw new Error('Failed to fetch recent transactions')
    }
  }

  static async getTopClients(limit = 5): Promise<TopClient[]> {
    try {
      // First get all clients with their calculated balance
      const allClients = await db
        .select({
          id: clients.id,
          nom: clients.nom,
          matricule: clients.matricule,
          solde: sql<number>`COALESCE(
            (SELECT SUM(CASE WHEN type = 'depot' THEN montant ELSE -montant END) 
             FROM transactions 
             WHERE client_id = clients.id), 
            0
          )`
        })
        .from(clients)

      // Filter clients with positive balance and sort
      const topClients = allClients
        .filter(client => client.solde > 0)
        .sort((a, b) => b.solde - a.solde)
        .slice(0, limit)

      return topClients.map(client => ({
        ...client,
        solde: Number(client.solde) || 0
      }))
    } catch (error) {
      console.error('Error fetching top clients:', error)
      throw new Error('Failed to fetch top clients')
    }
  }

  static async getTransactionEvolution(days = 7): Promise<TransactionEvolution[]> {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days + 1)

      const result = []

      for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + i)
        
        const dayStart = new Date(currentDate.setHours(0, 0, 0, 0)).toISOString()
        const dayEnd = new Date(currentDate.setHours(23, 59, 59, 999)).toISOString()

        const dayTransactions = await db
          .select({
            type: transactions.type,
            total: sql<number>`COALESCE(SUM(montant), 0)`
          })
          .from(transactions)
          .where(and(
            gte(transactions.createdAt, dayStart),
            lte(transactions.createdAt, dayEnd)
          ))
          .groupBy(transactions.type)

        let depots = 0
        let retraits = 0

        dayTransactions.forEach(transaction => {
          if (transaction.type === 'depot') {
            depots = Number(transaction.total) || 0
          } else if (transaction.type === 'retrait') {
            retraits = Number(transaction.total) || 0
          }
        })

        result.push({
          date: currentDate.toISOString().split('T')[0],
          depots,
          retraits
        })
      }

      return result
    } catch (error) {
      console.error('Error fetching transaction evolution:', error)
      throw new Error('Failed to fetch transaction evolution')
    }
  }

  static async getMonthlyCommissionStats() {
    try {
      const stats = await db
        .select({
          moisAnnee: commissions.moisAnnee,
          totalCommission: sql<number>`SUM(commission)`,
          nombreClients: sql<number>`COUNT(DISTINCT client_id)`
        })
        .from(commissions)
        .groupBy(commissions.moisAnnee)
        .orderBy(desc(commissions.moisAnnee))
        .limit(6)

      return stats
    } catch (error) {
      console.error('Error fetching monthly commission stats:', error)
      throw new Error('Failed to fetch monthly commission stats')
    }
  }
}