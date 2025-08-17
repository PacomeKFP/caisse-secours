import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const sqlite = new Database('./database.db')
export const db = drizzle(sqlite, { schema })

// Export sqlite instance for transactions
export const sqliteDb = sqlite

export * from './schema'

// Export appConfig for imports
export { appConfig } from './schema'