const fs = require('fs')
const path = require('path')

console.log('🏦 Microfinance Application')
console.log('=========================')
console.log('')

// Check if database exists
const dbPath = path.join(process.cwd(), 'database.db')
const dbExists = fs.existsSync(dbPath)

if (!dbExists) {
  console.log('⚠️  Database not found!')
  console.log('Please run: npm run db:setup')
  console.log('')
  process.exit(1)
}

console.log('✅ Database found')
console.log('🚀 Starting development server...')
console.log('')
console.log('📋 Login credentials:')
console.log('   Username: admin')
console.log('   Password: microfinance2025')
console.log('')
console.log('📖 Available at: http://localhost:3000')
console.log('')

// Start the dev server
require('child_process').spawn('npm', ['run', 'dev'], { 
  stdio: 'inherit',
  shell: true 
})