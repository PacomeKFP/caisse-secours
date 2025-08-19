import { NextRequest, NextResponse } from 'next/server'
import { ClientService } from '@/lib/services/clientService'
import { isAuthenticated } from '@/lib/auth/session'

interface BatchClient {
  matricule: string
  nom: string
  telephone: string
  createdAt?: string
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clients } = body

    console.log('POST /api/clients/batch-upload received:', body)

    if (!Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json(
        { error: 'Le champ "clients" doit être un tableau non vide' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]
      
      try {
        // Validation
        if (!client.matricule || !client.nom || !client.telephone) {
          errors.push({
            index: i,
            client,
            error: 'Champs requis manquants: matricule, nom, telephone'
          })
          continue
        }

        if (client.telephone && !/^[0-9+\-\s()]+$/.test(client.telephone)) {
          errors.push({
            index: i,
            client,
            error: 'Format de téléphone invalide'
          })
          continue
        }

        // Créer le client
        const newClient = await ClientService.createClient({
          matricule: client.matricule,
          nom: client.nom,
          telephone: client.telephone
        })

        results.push({
          index: i,
          success: true,
          client: newClient
        })

      } catch (error) {
        errors.push({
          index: i,
          client,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    }

    return NextResponse.json({
      total: clients.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    }, { status: 200 })

  } catch (error) {
    console.error('POST /api/clients/batch-upload error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}