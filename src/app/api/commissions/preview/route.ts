import { NextRequest, NextResponse } from 'next/server'
import { CommissionService } from '@/lib/services/commissionService'
import { isAuthenticated } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { moisAnnee } = body

    if (!moisAnnee) {
      return NextResponse.json(
        { error: 'Le mois et année sont requis' },
        { status: 400 }
      )
    }

    // Validate format YYYY-MM
    const dateRegex = /^\d{4}-\d{2}$/
    if (!dateRegex.test(moisAnnee)) {
      return NextResponse.json(
        { error: 'Format de date invalide (attendu: YYYY-MM)' },
        { status: 400 }
      )
    }

    const preview = await CommissionService.previewCommissionCollection(moisAnnee)
    return NextResponse.json(preview)
  } catch (error) {
    console.error('POST /api/commissions/preview error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}