import { NextRequest, NextResponse } from 'next/server'
import { ClientService } from '@/lib/services/clientService'
import { isAuthenticated } from '@/lib/auth/session'

export async function GET() {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clients = await ClientService.getAllClients()
    return NextResponse.json(clients)
  } catch (error) {
    console.error('GET /api/clients error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { matricule, nom, telephone } = body

    if (!matricule || !nom || !telephone) {
      return NextResponse.json(
        { error: 'Matricule, nom et téléphone sont requis' },
        { status: 400 }
      )
    }

    const client = await ClientService.createClient({
      matricule,
      nom,
      telephone
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('POST /api/clients error:', error)
    
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