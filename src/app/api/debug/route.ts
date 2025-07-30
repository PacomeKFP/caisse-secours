import { NextResponse } from 'next/server'
import { db, sqliteDb } from '@/lib/db'
import { clients, transactions, commissions } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    const diagnostics = {
      tables: {},
      counts: {},
      samples: {},
      calculations: {},
      issues: []
    }

    // 1. Vérifier les structures
    try {
      const tablesQuery = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
      diagnostics.tables.list = tablesQuery.map(t => t.name)
      
      const clientsSchema = sqliteDb.prepare("PRAGMA table_info(clients)").all()
      diagnostics.tables.clients = clientsSchema
      
      const transactionsSchema = sqliteDb.prepare("PRAGMA table_info(transactions)").all()
      diagnostics.tables.transactions = transactionsSchema
    } catch (error) {
      diagnostics.issues.push(`Structure error: ${error.message}`)
    }

    // 2. Compter les données
    try {
      const clientCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM clients").get()
      diagnostics.counts.clients = clientCount.count
      
      const transactionCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM transactions").get()
      diagnostics.counts.transactions = transactionCount.count
      
      const commissionCount = sqliteDb.prepare("SELECT COUNT(*) as count FROM commissions").get()
      diagnostics.counts.commissions = commissionCount.count
    } catch (error) {
      diagnostics.issues.push(`Count error: ${error.message}`)
    }

    // 3. Échantillons de données
    try {
      const sampleClients = sqliteDb.prepare("SELECT id, matricule, nom FROM clients LIMIT 3").all()
      diagnostics.samples.clients = sampleClients
      
      const sampleTransactions = sqliteDb.prepare("SELECT id, client_id, type, montant FROM transactions LIMIT 5").all()
      diagnostics.samples.transactions = sampleTransactions
    } catch (error) {
      diagnostics.issues.push(`Sample error: ${error.message}`)
    }

    // 4. Test calculs directs
    try {
      const firstClient = sqliteDb.prepare("SELECT id, nom FROM clients LIMIT 1").get()
      if (firstClient) {
        const totalDepots = sqliteDb.prepare(`
          SELECT COALESCE(SUM(montant), 0) as total 
          FROM transactions 
          WHERE client_id = ? AND type = 'depot'
        `).get(firstClient.id)
        
        const totalRetraits = sqliteDb.prepare(`
          SELECT COALESCE(SUM(montant), 0) as total 
          FROM transactions 
          WHERE client_id = ? AND type = 'retrait'
        `).get(firstClient.id)
        
        diagnostics.calculations.directSQL = {
          client: firstClient,
          depots: totalDepots.total,
          retraits: totalRetraits.total,
          solde: totalDepots.total - totalRetraits.total
        }
      }
    } catch (error) {
      diagnostics.issues.push(`Calculation error: ${error.message}`)
    }

    // 5. Test avec Drizzle
    try {
      const drizzleResult = await db
        .select({
          id: clients.id,
          nom: clients.nom,
          totalDepots: sql<number>`
            CAST(COALESCE((
              SELECT SUM(montant) 
              FROM transactions 
              WHERE client_id = ${clients.id} 
              AND type = 'depot'
            ), 0) AS REAL)
          `,
          totalRetraits: sql<number>`
            CAST(COALESCE((
              SELECT SUM(montant) 
              FROM transactions 
              WHERE client_id = ${clients.id} 
              AND type = 'retrait'
            ), 0) AS REAL)
          `
        })
        .from(clients)
        .limit(3)

      diagnostics.calculations.drizzle = drizzleResult.map(client => ({
        ...client,
        totalDepots: Number(client.totalDepots) || 0,
        totalRetraits: Number(client.totalRetraits) || 0
      }))
    } catch (error) {
      diagnostics.issues.push(`Drizzle error: ${error.message}`)
    }

    // 6. Vérifier les références orphelines
    try {
      const orphanTransactions = sqliteDb.prepare(`
        SELECT t.id, t.client_id, t.type, t.montant 
        FROM transactions t 
        LEFT JOIN clients c ON t.client_id = c.id 
        WHERE c.id IS NULL 
        LIMIT 5
      `).all()
      
      diagnostics.calculations.orphans = orphanTransactions
    } catch (error) {
      diagnostics.issues.push(`Orphan check error: ${error.message}`)
    }

    return NextResponse.json(diagnostics, { status: 200 })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 })
  }
}