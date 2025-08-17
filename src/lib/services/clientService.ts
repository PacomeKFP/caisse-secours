import { db, clients, transactions, commissions, Client, NewClient } from '@/lib/db'
import { eq, sum, sql, desc, like, or, count } from 'drizzle-orm'

export class ClientService {
  // Calculate balance dynamically for a single client
  static async calculateClientBalance(clientId: string): Promise<number> {
    try {
      const result = await db
        .select({
          depots: sql<number>`COALESCE(SUM(CASE WHEN type = 'depot' THEN montant ELSE 0 END), 0)`,
          retraits: sql<number>`COALESCE(SUM(CASE WHEN type = 'retrait' THEN montant ELSE 0 END), 0)`
        })
        .from(transactions)
        .where(eq(transactions.clientId, clientId))

      const { depots, retraits } = result[0] || { depots: 0, retraits: 0 }
      return Number(depots) - Number(retraits)
    } catch (error) {
      console.error('Error calculating client balance:', error)
      return 0
    }
  }

  static async getAllClients(page: number = 1, limit: number = 50, search: string = '') {
    try {
      const offset = (page - 1) * limit
      
      // Construire la condition de recherche
      const searchCondition = search 
        ? or(
            like(clients.nom, `%${search}%`),
            like(clients.matricule, `%${search}%`),
            like(clients.telephone, `%${search}%`)
          )
        : undefined

      // Compter le total
      const totalResult = await db
        .select({ count: count() })
        .from(clients)
        .where(searchCondition)
      
      const total = totalResult[0].count

      // Récupérer les clients avec pagination
      const result = await db
        .select({
          id: clients.id,
          matricule: clients.matricule,
          nom: clients.nom,
          telephone: clients.telephone,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
          totalDepots: sql<number>`
            CAST(COALESCE((
              SELECT SUM(montant) 
              FROM transactions 
              WHERE client_id = clients.id 
              AND type = 'depot'
            ), 0) AS REAL)
          `,
          totalRetraits: sql<number>`
            CAST(COALESCE((
              SELECT SUM(montant)
              FROM transactions 
              WHERE client_id = clients.id 
              AND type = 'retrait'
            ), 0) AS REAL)
          `,
          totalCommissions: sql<number>`
            CAST(COALESCE((
              SELECT SUM(commission)
              FROM commissions 
              WHERE client_id = clients.id
            ), 0) AS REAL)
          `,
          solde: sql<number>`
            CAST(COALESCE((
              SELECT SUM(CASE WHEN type = 'depot' THEN montant ELSE -montant END)
              FROM transactions 
              WHERE client_id = clients.id
            ), 0) AS REAL)
          `
        })
        .from(clients)
        .where(searchCondition)
        .orderBy(desc(clients.createdAt))
        .limit(limit)
        .offset(offset)

      const clientsData = result.map(client => ({
        ...client,
        totalDepots: Number(client.totalDepots) || 0,
        totalRetraits: Number(client.totalRetraits) || 0,
        totalCommissions: Number(client.totalCommissions) || 0,
        solde: Number(client.solde) || 0
      }))

      const pages = Math.ceil(total / limit)

      return {
        clients: clientsData,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      throw new Error('Failed to fetch clients')
    }
  }

  // Ancienne méthode pour compatibilité - deprecated
  static async getAllClientsLegacy() {
    const result = await this.getAllClients(1, 1000)
    return result.clients
  }

  static async getClientById(id: string) {
    try {
      const result = await db
        .select({
          id: clients.id,
          matricule: clients.matricule,
          nom: clients.nom,
          telephone: clients.telephone,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
          totalDepots: sql<number>`
            CAST(COALESCE((
              SELECT SUM(montant) 
              FROM transactions 
              WHERE client_id = clients.id 
              AND type = 'depot'
            ), 0) AS REAL)
          `,
          totalRetraits: sql<number>`
            CAST(COALESCE((
              SELECT SUM(montant)
              FROM transactions 
              WHERE client_id = clients.id 
              AND type = 'retrait'
            ), 0) AS REAL)
          `,
          totalCommissions: sql<number>`
            CAST(COALESCE((
              SELECT SUM(commission)
              FROM commissions 
              WHERE client_id = clients.id
            ), 0) AS REAL)
          `,
          solde: sql<number>`
            CAST(COALESCE((
              SELECT SUM(CASE WHEN type = 'depot' THEN montant ELSE -montant END)
              FROM transactions 
              WHERE client_id = clients.id
            ), 0) AS REAL)
          `
        })
        .from(clients)
        .where(eq(clients.id, id))
        .limit(1)

      const client = result[0] || null
      if (client) {
        return {
          ...client,
          totalDepots: Number(client.totalDepots) || 0,
          totalRetraits: Number(client.totalRetraits) || 0,
          totalCommissions: Number(client.totalCommissions) || 0,
          solde: Number(client.solde) || 0
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching client:', error)
      throw new Error('Failed to fetch client')
    }
  }

  static async createClient(clientData: Omit<NewClient, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Check if matricule already exists
      const existing = await db
        .select()
        .from(clients)
        .where(eq(clients.matricule, clientData.matricule))
        .limit(1)

      if (existing.length > 0) {
        throw new Error('Ce matricule existe déjà')
      }

      const result = await db
        .insert(clients)
        .values(clientData)
        .returning()

      return result[0]
    } catch (error) {
      console.error('Error creating client:', error)
      if (error instanceof Error && error.message === 'Ce matricule existe déjà') {
        throw error
      }
      throw new Error('Failed to create client')
    }
  }

  static async updateClient(id: string, clientData: Partial<Omit<NewClient, 'id' | 'createdAt'>>) {
    try {
      // If matricule is being updated, check for uniqueness
      if (clientData.matricule) {
        const existing = await db
          .select()
          .from(clients)
          .where(eq(clients.matricule, clientData.matricule))
          .limit(1)

        if (existing.length > 0 && existing[0].id !== id) {
          throw new Error('Ce matricule existe déjà')
        }
      }

      const result = await db
        .update(clients)
        .set({
          ...clientData,
          updatedAt: new Date().toISOString()
        })
        .where(eq(clients.id, id))
        .returning()

      return result[0]
    } catch (error) {
      console.error('Error updating client:', error)
      if (error instanceof Error && error.message === 'Ce matricule existe déjà') {
        throw error
      }
      throw new Error('Failed to update client')
    }
  }

  static async deleteClient(id: string) {
    try {
      // Check if client has transactions
      const clientTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.clientId, id))
        .limit(1)

      if (clientTransactions.length > 0) {
        throw new Error('Impossible de supprimer un client avec des transactions')
      }

      await db
        .delete(clients)
        .where(eq(clients.id, id))

      return true
    } catch (error) {
      console.error('Error deleting client:', error)
      if (error instanceof Error && error.message.includes('Impossible de supprimer')) {
        throw error
      }
      throw new Error('Failed to delete client')
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

  static async getClientCommissions(clientId: string) {
    try {
      const result = await db
        .select()
        .from(commissions)
        .where(eq(commissions.clientId, clientId))
        .orderBy(desc(commissions.createdAt))

      return result
    } catch (error) {
      console.error('Error fetching client commissions:', error)
      throw new Error('Failed to fetch client commissions')
    }
  }

  static async generateMatricule() {
    try {
      const lastClient = await db
        .select({ matricule: clients.matricule })
        .from(clients)
        .orderBy(desc(clients.createdAt))
        .limit(1)

      if (lastClient.length === 0) {
        return 'CLT001'
      }

      const lastMatricule = lastClient[0].matricule
      const numMatch = lastMatricule.match(/\d+$/)
      
      if (numMatch) {
        const nextNum = parseInt(numMatch[0]) + 1
        return `CLT${nextNum.toString().padStart(3, '0')}`
      }

      return 'CLT001'
    } catch (error) {
      console.error('Error generating matricule:', error)
      return 'CLT001'
    }
  }
}