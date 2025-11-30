import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

console.log('Drizzle config loaded');

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    // dbCredentials: {
    //     url: process.env.VITE_SUPABASE_URL || '',
    // },
    verbose: true,
    strict: true,
});
