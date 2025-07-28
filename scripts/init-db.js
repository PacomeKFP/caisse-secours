const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Initializing microfinance database...')

try {
  // Check if database exists
  const dbPath = path.join(process.cwd(), 'database.db')
  const dbExists = fs.existsSync(dbPath)
  
  if (dbExists) {
    console.log('📦 Database already exists')
  } else {
    console.log('📦 Creating new database...')
  }

  // Generate and run migrations
  console.log('📝 Generating migrations...')
  execSync('npx drizzle-kit generate', { stdio: 'inherit' })
  
  console.log('🔧 Running migrations...')
  execSync('npx drizzle-kit migrate', { stdio: 'inherit' })
  
  // Run seed
  console.log('🌱 Seeding database...')
  execSync('npx tsx src/lib/db/seed.ts', { stdio: 'inherit' })
  
  console.log('✅ Database initialization complete!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('  1. npm run dev')
  console.log('  2. Open http://localhost:3000')
  console.log('  3. Login with: admin / microfinance2025')
  
} catch (error) {
  console.error('❌ Database initialization failed:', error.message)
  process.exit(1)
}