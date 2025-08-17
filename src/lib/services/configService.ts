import { db, appConfig, AppConfig, NewAppConfig } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// Configuration par défaut pour le Cameroun
const DEFAULT_CONFIG = {
  // Transactions
  'transactions.max_amount': {
    value: 10000000,
    description: 'Montant maximum par transaction (FCFA)',
    type: 'number',
    category: 'transactions'
  },
  'transactions.min_depot': {
    value: 500,
    description: 'Montant minimum pour un dépôt (FCFA)',
    type: 'number',
    category: 'transactions'
  },
  'transactions.min_retrait': {
    value: 100,
    description: 'Montant minimum pour un retrait (FCFA)',
    type: 'number',
    category: 'transactions'
  },
  
  // Clients
  'clients.matricule_min_length': {
    value: 3,
    description: 'Longueur minimum du matricule client',
    type: 'number',
    category: 'clients'
  },
  'clients.matricule_max_length': {
    value: 20,
    description: 'Longueur maximum du matricule client',
    type: 'number',
    category: 'clients'
  },
  'clients.nom_min_length': {
    value: 2,
    description: 'Longueur minimum du nom client',
    type: 'number',
    category: 'clients'
  },
  'clients.nom_max_length': {
    value: 100,
    description: 'Longueur maximum du nom client',
    type: 'number',
    category: 'clients'
  },
  'clients.default_country_code': {
    value: '+237',
    description: 'Code pays par défaut pour les téléphones',
    type: 'string',
    category: 'clients'
  },
  'clients.phone_validation_strict': {
    value: true,
    description: 'Validation stricte du format téléphone international',
    type: 'boolean',
    category: 'clients'
  },
  'clients.require_international_phone': {
    value: true,
    description: 'Exiger le format international pour les téléphones',
    type: 'boolean',
    category: 'clients'
  },
  
  // Système
  'system.default_page_size': {
    value: 50,
    description: 'Nombre d\'éléments par page par défaut',
    type: 'number',
    category: 'system'
  },
  'system.max_page_size': {
    value: 1000,
    description: 'Nombre maximum d\'éléments par page',
    type: 'number',
    category: 'system'
  },
  'system.enable_search': {
    value: true,
    description: 'Activer la recherche dans les listes',
    type: 'boolean',
    category: 'system'
  },
  'system.company_name': {
    value: 'Caisse Secours',
    description: 'Nom de l\'entreprise',
    type: 'string',
    category: 'system'
  },
  'system.currency': {
    value: 'FCFA',
    description: 'Devise par défaut',
    type: 'string',
    category: 'system'
  },
  'system.country': {
    value: 'Cameroun',
    description: 'Pays d\'opération',
    type: 'string',
    category: 'system'
  },
  
  // Sécurité
  'security.enable_audit_log': {
    value: true,
    description: 'Activer les logs d\'audit',
    type: 'boolean',
    category: 'security'
  },
  'security.max_login_attempts': {
    value: 5,
    description: 'Nombre maximum de tentatives de connexion',
    type: 'number',
    category: 'security'
  },
  'security.session_timeout_minutes': {
    value: 480,
    description: 'Durée de session en minutes (8h par défaut)',
    type: 'number',
    category: 'security'
  }
}

export class ConfigService {
  // Initialiser la configuration avec les valeurs par défaut
  static async initializeConfig() {
    try {
      for (const [key, config] of Object.entries(DEFAULT_CONFIG)) {
        const existing = await db.select()
          .from(appConfig)
          .where(and(
            eq(appConfig.category, config.category),
            eq(appConfig.key, key)
          ))
          .limit(1)

        if (existing.length === 0) {
          await db.insert(appConfig).values({
            category: config.category,
            key: key,
            value: JSON.stringify(config.value),
            description: config.description,
            type: config.type,
            updatedBy: 'system'
          })
        }
      }
      console.log('Configuration initialisée avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la configuration:', error)
      throw error
    }
  }

  // Récupérer une valeur de configuration
  static async get<T = any>(category: string, key: string): Promise<T | null> {
    try {
      const fullKey = `${category}.${key}`
      const result = await db.select()
        .from(appConfig)
        .where(and(
          eq(appConfig.category, category),
          eq(appConfig.key, fullKey)
        ))
        .limit(1)

      if (result.length === 0) {
        // Retourner la valeur par défaut si elle existe
        const defaultValue = DEFAULT_CONFIG[fullKey as keyof typeof DEFAULT_CONFIG]
        return defaultValue ? defaultValue.value as T : null
      }

      const config = result[0]
      return JSON.parse(config.value) as T
    } catch (error) {
      console.error(`Erreur lors de la récupération de la config ${category}.${key}:`, error)
      return null
    }
  }

  // Mettre à jour une valeur de configuration
  static async set(category: string, key: string, value: any, updatedBy: string = 'system') {
    try {
      const fullKey = `${category}.${key}`
      const existing = await db.select()
        .from(appConfig)
        .where(and(
          eq(appConfig.category, category),
          eq(appConfig.key, fullKey)
        ))
        .limit(1)

      const serializedValue = JSON.stringify(value)

      if (existing.length === 0) {
        // Créer nouvelle configuration
        const defaultConfig = DEFAULT_CONFIG[fullKey as keyof typeof DEFAULT_CONFIG]
        await db.insert(appConfig).values({
          category,
          key: fullKey,
          value: serializedValue,
          description: defaultConfig?.description || `Configuration ${fullKey}`,
          type: defaultConfig?.type || typeof value,
          updatedBy
        })
      } else {
        // Mettre à jour existante
        await db.update(appConfig)
          .set({
            value: serializedValue,
            updatedAt: new Date().toISOString(),
            updatedBy
          })
          .where(eq(appConfig.id, existing[0].id))
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la config ${category}.${key}:`, error)
      throw error
    }
  }

  // Récupérer toute la configuration par catégorie
  static async getByCategory(category: string): Promise<Record<string, any>> {
    try {
      const results = await db.select()
        .from(appConfig)
        .where(eq(appConfig.category, category))

      const config: Record<string, any> = {}
      
      for (const item of results) {
        const shortKey = item.key.replace(`${category}.`, '')
        config[shortKey] = {
          value: JSON.parse(item.value),
          description: item.description,
          type: item.type,
          updatedAt: item.updatedAt,
          updatedBy: item.updatedBy
        }
      }

      return config
    } catch (error) {
      console.error(`Erreur lors de la récupération de la catégorie ${category}:`, error)
      return {}
    }
  }

  // Récupérer toute la configuration
  static async getAll(): Promise<Record<string, Record<string, any>>> {
    try {
      const results = await db.select().from(appConfig)
      const config: Record<string, Record<string, any>> = {}

      for (const item of results) {
        if (!config[item.category]) {
          config[item.category] = {}
        }
        
        const shortKey = item.key.replace(`${item.category}.`, '')
        config[item.category][shortKey] = {
          value: JSON.parse(item.value),
          description: item.description,
          type: item.type,
          updatedAt: item.updatedAt,
          updatedBy: item.updatedBy
        }
      }

      return config
    } catch (error) {
      console.error('Erreur lors de la récupération de toute la configuration:', error)
      return {}
    }
  }

  // Méthodes de raccourci pour les configurations fréquemment utilisées
  static async getTransactionLimits() {
    return {
      maxAmount: await this.get<number>('transactions', 'max_amount') || 10000000,
      minDepot: await this.get<number>('transactions', 'min_depot') || 500,
      minRetrait: await this.get<number>('transactions', 'min_retrait') || 100
    }
  }

  static async getClientValidation() {
    return {
      matriculeMinLength: await this.get<number>('clients', 'matricule_min_length') || 3,
      matriculeMaxLength: await this.get<number>('clients', 'matricule_max_length') || 20,
      nomMinLength: await this.get<number>('clients', 'nom_min_length') || 2,
      nomMaxLength: await this.get<number>('clients', 'nom_max_length') || 100,
      defaultCountryCode: await this.get<string>('clients', 'default_country_code') || '+237',
      phoneValidationStrict: await this.get<boolean>('clients', 'phone_validation_strict') || true,
      requireInternationalPhone: await this.get<boolean>('clients', 'require_international_phone') || true
    }
  }

  static async getSystemConfig() {
    return {
      defaultPageSize: await this.get<number>('system', 'default_page_size') || 50,
      maxPageSize: await this.get<number>('system', 'max_page_size') || 1000,
      enableSearch: await this.get<boolean>('system', 'enable_search') || true,
      companyName: await this.get<string>('system', 'company_name') || 'Caisse Secours',
      currency: await this.get<string>('system', 'currency') || 'FCFA',
      country: await this.get<string>('system', 'country') || 'Cameroun'
    }
  }

  // Réinitialiser une configuration à sa valeur par défaut
  static async resetToDefault(category: string, key: string) {
    const fullKey = `${category}.${key}`
    const defaultConfig = DEFAULT_CONFIG[fullKey as keyof typeof DEFAULT_CONFIG]
    
    if (defaultConfig) {
      await this.set(category, key, defaultConfig.value, 'system')
    }
  }

  // Réinitialiser toute la configuration
  static async resetAllToDefault() {
    try {
      await db.delete(appConfig)
      await this.initializeConfig()
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error)
      throw error
    }
  }
}