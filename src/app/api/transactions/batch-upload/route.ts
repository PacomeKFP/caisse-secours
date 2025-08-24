import { NextRequest, NextResponse } from 'next/server'
import { TransactionService } from '@/lib/services/transactionService'
import { isAuthenticated } from '@/lib/auth/session'
import { StandardExportFormat, ImportFormat } from '@/types'

interface BatchTransaction {
  clientId: string
  type: 'depot' | 'retrait'
  montant: number
  description?: string
  sourceDestination: string
  createdAt?: string
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('POST /api/transactions/batch-upload received:', body)

    // Détection automatique du format (nouveau standard ou ancien)
    let transactions: BatchTransaction[]
    
    if (Array.isArray(body)) {
      // Format ancien: tableau direct
      transactions = body
      console.log('Format détecté: ancien (tableau direct)')
    } else if (body.transactions && Array.isArray(body.transactions)) {
      // Format nouveau: objet standard avec clé "transactions"
      transactions = body.transactions
      console.log('Format détecté: nouveau standard interopérable')
    } else {
      return NextResponse.json(
        { error: 'Format invalide. Attendu: tableau de transactions ou objet {transactions: [...]}' },
        { status: 400 }
      )
    }

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Aucune transaction trouvée dans les données' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i]
      
      try {
        // Validation
        if (!transaction.clientId || !transaction.type || !transaction.montant || !transaction.sourceDestination) {
          errors.push({
            index: i,
            transaction,
            error: 'Champs requis manquants: clientId, type, montant, sourceDestination'
          })
          continue
        }

        if (!['depot', 'retrait'].includes(transaction.type)) {
          errors.push({
            index: i,
            transaction,
            error: 'Type de transaction invalide (doit être "depot" ou "retrait")'
          })
          continue
        }

        if (transaction.montant <= 0) {
          errors.push({
            index: i,
            transaction,
            error: 'Le montant doit être positif'
          })
          continue
        }

        // Créer la transaction
        const newTransaction = await TransactionService.createTransaction({
          clientId: transaction.clientId,
          type: transaction.type,
          montant: transaction.montant,
          description: transaction.description || null,
          sourceDestination: transaction.sourceDestination
        })

        results.push({
          index: i,
          success: true,
          transaction: newTransaction
        })

      } catch (error) {
        errors.push({
          index: i,
          transaction,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    }

    return NextResponse.json({
      total: transactions.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    }, { status: 200 })

  } catch (error) {
    console.error('POST /api/transactions/batch-upload error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}