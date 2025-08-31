import { db, sqliteDb, clients, transactions, commissions, commissionConfig, Commission, NewCommission, CommissionConfig } from '@/lib/db'
import { eq, desc, and, sql } from 'drizzle-orm'

export interface CommissionCalculation {
  clientId: string
  nom: string
  matricule: string
  soldeBase: number
  commission: number
  tranche: {
    montantMin: number
    montantMax: number | null
    montant: number
  } | null
}

export class CommissionService {
  static async getCommissionConfig() {
    try {
      const config = await db
        .select()
        .from(commissionConfig)
        .orderBy(commissionConfig.ordre)

      return config
    } catch (error) {
      console.error('Error fetching commission config:', error)
      throw new Error('Failed to fetch commission config')
    }
  }

  static async updateCommissionConfig(configData: Omit<CommissionConfig, 'id' | 'createdAt' | 'updatedAt'>[]) {
    try {
      // Use better-sqlite3 transaction
      sqliteDb.transaction(() => {
        // Delete existing config
        sqliteDb.prepare('DELETE FROM commission_config').run()

        // Insert new config
        const insertStmt = sqliteDb.prepare(`
          INSERT INTO commission_config (id, montant_min, montant_max, montant, ordre, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        
        for (const config of configData) {
          const id = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const now = new Date().toISOString()
          insertStmt.run(
            id,
            config.montantMin,
            config.montantMax,
            config.montant,
            config.ordre,
            now,
            now
          )
        }
      })()
      
      return true
    } catch (error) {
      console.error('Error updating commission config:', error)
      throw error
    }
  }

  static calculateCommission(solde: number, config: CommissionConfig[]): {
    commission: number
    tranche: {
      montantMin: number
      montantMax: number | null
      montant: number
    } | null
  } {
    // Find the appropriate tranche for this solde
    for (const tranche of config) {
      const montantMin = tranche.montantMin
      const montantMax = tranche.montantMax
      
      // Check if solde falls in this tranche
      const inRange = montantMax === null 
        ? solde >= montantMin  // Last tranche (no upper limit)
        : solde >= montantMin && solde <= montantMax
      
      if (inRange) {
        return {
          commission: tranche.montant, // Fixed amount for this tranche
          tranche: {
            montantMin,
            montantMax,
            montant: tranche.montant
          }
        }
      }
    }

    // No matching tranche found (solde too low)
    return {
      commission: 0,
      tranche: null
    }
  }

  static async previewCommissionCollection(moisAnnee: string): Promise<CommissionCalculation[]> {
    try {
      // Check if commissions already exist for this month
      const existing = await db
        .select()
        .from(commissions)
        .where(eq(commissions.moisAnnee, moisAnnee))
        .limit(1)

      if (existing.length > 0) {
        throw new Error(`Les commissions pour ${moisAnnee} ont déjà été collectées`)
      }

      // Get commission configuration
      const config = await this.getCommissionConfig()
      if (config.length === 0) {
        throw new Error('Configuration des commissions non trouvée')
      }

      // Get all clients with their current balance (calculated dynamically)
      const clientList = await db
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
        .where(sql`(
          SELECT COALESCE(SUM(CASE WHEN type = 'depot' THEN montant ELSE -montant END), 0) 
          FROM transactions 
          WHERE client_id = clients.id
        ) > 0`)

      const calculations: CommissionCalculation[] = []

      for (const client of clientList) {
        const solde = Number(client.solde) || 0
        const calculation = this.calculateCommission(solde, config)
        
        if (calculation.commission > 0) {
          calculations.push({
            clientId: client.id,
            nom: client.nom,
            matricule: client.matricule,
            soldeBase: solde,
            commission: Number(calculation.commission) || 0,
            tranche: calculation.tranche
          })
        }
      }

      return calculations
    } catch (error) {
      console.error('Error previewing commission collection:', error)
      throw error
    }
  }

  static async collectCommissions(moisAnnee: string): Promise<CommissionCalculation[]> {
    try {
      // Preview calculations first
      const calculations = await this.previewCommissionCollection(moisAnnee)

      // Use better-sqlite3 transaction
      sqliteDb.transaction(() => {
        const commissionStmt = sqliteDb.prepare(`
          INSERT INTO commissions (id, client_id, montant_total, commission, label, type, mois_annee, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        
        const transactionStmt = sqliteDb.prepare(`
          INSERT INTO transactions (id, client_id, type, montant, description, source_destination, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        
        // Create commission records and corresponding withdrawal transactions
        for (const calc of calculations) {
          const commissionId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const transactionId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const now = new Date().toISOString()
          
          // Insert commission record
          commissionStmt.run(
            commissionId,
            calc.clientId,
            calc.soldeBase,
            calc.commission,
            `Commission ${moisAnnee}`,
            'mensuelle',
            moisAnnee,
            now,
            now
          )

          // Create withdrawal transaction for the commission
          transactionStmt.run(
            transactionId,
            calc.clientId,
            'retrait',
            calc.commission,
            `Commission prélevée pour ${this.formatMoisAnnee(moisAnnee)}`,
            'COMMISSION_SYSTEM',
            now,
            now
          )
        }
      })()
      
      return calculations
    } catch (error) {
      console.error('Error collecting commissions:', error)
      throw error
    }
  }

  static async getCommissionHistory(page = 1, limit = 50, filters?: {
    clientId?: string
    moisAnnee?: string
  }) {
    try {
      // Build conditions
      const conditions = []
      if (filters?.clientId) {
        conditions.push(eq(commissions.clientId, filters.clientId))
      }
      if (filters?.moisAnnee) {
        conditions.push(eq(commissions.moisAnnee, filters.moisAnnee))
      }

      // Build query with or without filters
      const query = db
        .select({
          id: commissions.id,
          clientId: commissions.clientId,
          montantTotal: commissions.montantTotal,
          commission: commissions.commission,
          label: commissions.label,
          type: commissions.type,
          moisAnnee: commissions.moisAnnee,
          createdAt: commissions.createdAt,
          clientNom: clients.nom,
          clientMatricule: clients.matricule
        })
        .from(commissions)
        .leftJoin(clients, eq(commissions.clientId, clients.id))
        .$dynamic()

      // Apply conditions if any
      const finalQuery = conditions.length > 0 
        ? query.where(and(...conditions))
        : query

      const offset = (page - 1) * limit
      const result = await finalQuery
        .orderBy(desc(commissions.createdAt))
        .limit(limit)
        .offset(offset)

      return result.map(row => ({
        ...row,
        montantTotal: Number(row.montantTotal) || 0,
        commission: Number(row.commission) || 0
      }))
    } catch (error) {
      console.error('Error fetching commission history:', error)
      throw new Error('Failed to fetch commission history')
    }
  }

  static async getClientCommissions(clientId: string) {
    try {
      const result = await db
        .select()
        .from(commissions)
        .where(eq(commissions.clientId, clientId))
        .orderBy(desc(commissions.moisAnnee))

      return result
    } catch (error) {
      console.error('Error fetching client commissions:', error)
      throw new Error('Failed to fetch client commissions')
    }
  }

  static async getMonthlyCommissionStats() {
    try {
      const stats = await db
        .select({
          moisAnnee: commissions.moisAnnee,
          totalCommission: sql<number>`SUM(${commissions.commission})`,
          nombreClients: sql<number>`COUNT(DISTINCT ${commissions.clientId})`,
          montantMoyenBase: sql<number>`AVG(${commissions.montantTotal})`
        })
        .from(commissions)
        .groupBy(commissions.moisAnnee)
        .orderBy(desc(commissions.moisAnnee))

      return stats
    } catch (error) {
      console.error('Error fetching monthly commission stats:', error)
      throw new Error('Failed to fetch monthly commission stats')
    }
  }

  static async getAvailableMonths(): Promise<string[]> {
    try {
      const months = await db
        .selectDistinct({ moisAnnee: commissions.moisAnnee })
        .from(commissions)
        .orderBy(desc(commissions.moisAnnee))

      return months.map(m => m.moisAnnee)
    } catch (error) {
      console.error('Error fetching available months:', error)
      return []
    }
  }

  static getCurrentMonth(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    return `${year}-${month}`
  }

  static getLastMonth(): string {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const year = lastMonth.getFullYear()
    const month = (lastMonth.getMonth() + 1).toString().padStart(2, '0')
    return `${year}-${month}`
  }

  static formatMoisAnnee(moisAnnee: string): string {
    const [year, month] = moisAnnee.split('-')
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    return `${months[parseInt(month) - 1]} ${year}`
  }
}