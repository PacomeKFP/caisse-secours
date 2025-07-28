import { db, clients, transactions, commissionConfig } from './index'
import { eq } from 'drizzle-orm'

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...')

    // Create default commission configuration
    await db.insert(commissionConfig).values([
      {
        montantMin: 0,
        montantMax: 50000,
        taux: 2.0,
        ordre: 1
      },
      {
        montantMin: 50001,
        montantMax: 100000,
        taux: 3.0,
        ordre: 2
      },
      {
        montantMin: 100001,
        montantMax: 200000,
        taux: 4.0,
        ordre: 3
      },
      {
        montantMin: 200001,
        montantMax: null,
        taux: 5.0,
        ordre: 4
      }
    ]).onConflictDoNothing()

    // Create sample clients
    const sampleClients = [
      {
        matricule: 'CLT001',
        nom: 'Jean Dupont',
        telephone: '+237677123456',
        solde: 75000
      },
      {
        matricule: 'CLT002',
        nom: 'Marie Ngozi',
        telephone: '+237698234567',
        solde: 125000
      },
      {
        matricule: 'CLT003',
        nom: 'Paul Mboma',
        telephone: '+237655345678',
        solde: 45000
      },
      {
        matricule: 'CLT004',
        nom: 'Sarah Fouda',
        telephone: '+237679456789',
        solde: 85000
      },
      {
        matricule: 'CLT005',
        nom: 'Alain Biya',
        telephone: '+237656567890',
        solde: 200000
      }
    ]

    // Insert clients
    for (const clientData of sampleClients) {
      const existing = await db
        .select()
        .from(clients)
        .where(eq(clients.matricule, clientData.matricule))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(clients).values(clientData)
        console.log(`✅ Created client: ${clientData.nom}`)
      }
    }

    console.log('✅ Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run seed if called directly
if (typeof require !== 'undefined' && require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seed failed:', error)
      process.exit(1)
    })
}