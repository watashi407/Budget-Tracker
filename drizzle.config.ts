import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

/**
 * Drizzle Kit Configuration
 * Used for database migrations and schema management with Supabase.
 * Run: npx drizzle-kit generate / npx drizzle-kit push
 */
export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
})
