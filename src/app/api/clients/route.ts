import { NextRequest, NextResponse } from 'next/server'
import { ClientService } from '@/lib/services/clientService'
import { ConfigService } from '@/lib/services/configService'
import { isAuthenticated } from '@/lib/auth/session'
import { CaisseLogger } from '@/lib/logging/CaisseLogger'

export async function GET(request: NextRequest) {
  const start = Date.now()
  
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      CaisseLogger.logUserAction('anonymous', 'unauthorized_api_access', '/api/clients')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Paramètres de pagination
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    // Récupérer la configuration système
    const systemConfig = await ConfigService.getSystemConfig()
    
    // Validation des paramètres
    if (page < 1) {
      return NextResponse.json({ error: 'Le numéro de page doit être supérieur à 0' }, { status: 400 })
    }
    if (limit < 1 || limit > systemConfig.maxPageSize) {
      return NextResponse.json({ error: `La limite doit être entre 1 et ${systemConfig.maxPageSize}` }, { status: 400 })
    }

    CaisseLogger.logUserAction('system', 'clients_list_requested', 'clients', { page, limit, search })
    
    const result = await ClientService.getAllClients(page, limit, search)
    
    // Log business metrics
    CaisseLogger.logBusinessMetrics({
      totalClients: result.total
    })
    
    // Log performance
    CaisseLogger.logPerformance('get_all_clients', {
      duration: Date.now() - start
    }, 'clients')
    
    CaisseLogger.logDataAccess('system', 'clients', 'read', result.clients.map(c => c.id))
    
    // Réponse avec métadonnées de pagination
    return NextResponse.json({
      clients: result.clients,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        pages: result.pagination.pages,
        hasNext: result.pagination.hasNext,
        hasPrev: result.pagination.hasPrev
      }
    })
  } catch (error) {
    CaisseLogger.logError(error as Error, {
      module: 'clients',
      operation: 'get_all',
      duration: Date.now() - start
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const start = Date.now()
  
  try {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
      CaisseLogger.logUserAction('anonymous', 'unauthorized_api_access', '/api/clients')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { matricule, nom, telephone } = body

    // Récupérer la configuration de validation des clients
    const clientConfig = await ConfigService.getClientValidation()

    // Validation des champs requis
    if (!matricule || !nom || !telephone) {
      CaisseLogger.logUserAction('system', 'client_creation_validation_failed', 'clients', {
        reason: 'missing_required_fields',
        provided_fields: Object.keys(body)
      })
      
      return NextResponse.json(
        { 
          error: 'Champs requis manquants',
          details: 'Les champs matricule, nom et telephone sont obligatoires',
          received: { matricule: !!matricule, nom: !!nom, telephone: !!telephone }
        },
        { status: 400 }
      )
    }

    // Validation du matricule
    if (typeof matricule !== 'string' || matricule.length < clientConfig.matriculeMinLength || matricule.length > clientConfig.matriculeMaxLength) {
      return NextResponse.json(
        { 
          error: 'Matricule invalide',
          details: `Le matricule doit être une chaîne de ${clientConfig.matriculeMinLength} à ${clientConfig.matriculeMaxLength} caractères`,
          received: { matricule, length: matricule?.length }
        },
        { status: 400 }
      )
    }

    // Validation du nom
    if (typeof nom !== 'string' || nom.trim().length < clientConfig.nomMinLength || nom.length > clientConfig.nomMaxLength) {
      return NextResponse.json(
        { 
          error: 'Nom invalide',
          details: `Le nom doit être une chaîne de ${clientConfig.nomMinLength} à ${clientConfig.nomMaxLength} caractères`,
          received: { nom, length: nom?.length }
        },
        { status: 400 }
      )
    }

    // Validation du téléphone
    if (clientConfig.requireInternationalPhone) {
      const phoneRegex = clientConfig.phoneValidationStrict ? /^\+[1-9]\d{1,14}$/ : /^\+\d+$/
      if (typeof telephone !== 'string' || !phoneRegex.test(telephone)) {
        return NextResponse.json(
          { 
            error: 'Numéro de téléphone invalide',
            details: `Le téléphone doit être au format international (${clientConfig.defaultCountryCode}XXXXXXXXX)`,
            received: { telephone },
            format: `${clientConfig.defaultCountryCode}XXXXXXXXX (ex: ${clientConfig.defaultCountryCode}123456789)`
          },
          { status: 400 }
        )
      }
    }

    CaisseLogger.logUserAction('system', 'client_creation_attempt', 'clients', {
      matricule: matricule,
      nom: nom
    })

    const client = await ClientService.createClient({
      matricule,
      nom,
      telephone
    })

    // Log successful creation
    CaisseLogger.logClientAction('created', client.id, {
      matricule: client.matricule,
      nom: client.nom
    })
    
    CaisseLogger.logPerformance('create_client', {
      duration: Date.now() - start
    }, 'clients')

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    CaisseLogger.logError(error as Error, {
      module: 'clients',
      operation: 'create',
      duration: Date.now() - start,
      input_data: {
        matricule: body?.matricule,
        nom: body?.nom
      }
    })
    
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