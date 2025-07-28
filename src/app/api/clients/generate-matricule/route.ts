import { NextResponse } from 'next/server'
import { ClientService } from '@/lib/services/clientService'
import { isAuthenticated } from '@/lib/auth/session'

export async function GET() {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const matricule = await ClientService.generateMatricule()
    return NextResponse.json({ matricule })
  } catch (error) {
    console.error('GET /api/clients/generate-matricule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}