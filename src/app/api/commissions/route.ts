import { NextRequest, NextResponse } from 'next/server'
import { CommissionService } from '@/lib/services/commissionService'
import { isAuthenticated } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const clientId = searchParams.get('clientId') || undefined
    const moisAnnee = searchParams.get('moisAnnee') || undefined

    const filters = { clientId, moisAnnee }

    const commissions = await CommissionService.getCommissionHistory(page, limit, filters)
    return NextResponse.json(commissions)
  } catch (error) {
    console.error('GET /api/commissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}