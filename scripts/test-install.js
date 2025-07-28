const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Microfinance App Installation')
console.log('=====================================')
console.log('')

let hasErrors = false

// Check essential files
const essentialFiles = [
  'package.json',
  'next.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  'drizzle.config.ts',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/login/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/clients/page.tsx',
  'src/app/transactions/page.tsx',
  'src/app/commissions/page.tsx',
  'src/lib/db/schema.ts',
  'src/lib/auth/session.ts',
  'src/components/Sidebar.tsx'
]

console.log('📁 Checking essential files...')
for (const file of essentialFiles) {
  const exists = fs.existsSync(path.join(process.cwd(), file))
  if (exists) {
    console.log(`  ✅ ${file}`)
  } else {
    console.log(`  ❌ ${file} - Missing!`)
    hasErrors = true
  }
}

console.log('')

// Check package.json dependencies
console.log('📦 Checking package.json...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  
  const requiredDeps = [
    'next', 'react', 'react-dom', 'drizzle-orm', 
    'better-sqlite3', 'jose', 'sonner', 'lucide-react'
  ]
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep}`)
    } else {
      console.log(`  ❌ ${dep} - Missing dependency!`)
      hasErrors = true
    }
  }
} catch (error) {
  console.log('  ❌ Cannot read package.json')
  hasErrors = true
}

console.log('')

// Check database
console.log('💾 Checking database...')
const dbExists = fs.existsSync('database.db')
if (dbExists) {
  console.log('  ✅ database.db exists')
} else {
  console.log('  ⚠️  database.db not found (run npm run db:setup)')
}

console.log('')

// Final result
if (hasErrors) {
  console.log('❌ Installation has errors!')
  console.log('Please check the missing files and dependencies.')
  process.exit(1)
} else {
  console.log('✅ Installation looks good!')
  console.log('')
  console.log('🚀 Ready to start:')
  console.log('  npm run db:setup   # (if database not found)')
  console.log('  npm run serve      # Start the app')
  console.log('')
  console.log('📖 Then open: http://localhost:3000')
  console.log('🔑 Login: admin / microfinance2025')
}