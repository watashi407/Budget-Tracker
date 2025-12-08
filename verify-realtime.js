import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runVerification() {
  console.log('--- Supabase Realtime Verification ---')
  console.log('Instructions: Open your browser to the Dashboard.')
  console.log('This script will create a new budget named "REALTIME TEST".')
  console.log('Watch your screen! It should appear instantly.')
  
  // 1. Get a user ID (we need a valid user ID to insert a budget)
  // For this test, user writes their own ID, or we pick the first one we find in profiles?
  // We can't query auth.users easily with anon key usually. 
  // Let's ask the user to provide their ID, OR we try to fetch a public profile if table is public.
  // Actually, better: we hardcode a known user or ask user to provide it.
  // Wait, I can see `reproduce_budget_issue.ts` has some logic. 
  
  // Let's simplified: We will insert a record. 
  // PROBLEM: RLS might prevent anon insert if not authenticated.
  // If RLS is on, we need to sign in.
  
  console.log('\nLogging in to perform database operations...')
  // We need a test user. prompting user is hard.
  // I will write this script to require a user email/pass or just warn about RLS.
  // If I can't login, I can't verify easily via script if RLS is strict.
  
  // ALTERNATIVE: Use the Service Role Key if available? No, usually not in client .env.
  
  // Let's try to just insert. If it fails, we know why.
  // But wait, budget table usually requires `user_id`.
  
  console.log('Fetching a user session...')
  // Assuming the user has a way to get their ID or we just fail if we can't.
  
  // Actually, simplest way: Just ask the user to provide their User ID as an argument.
  const userId = process.argv[2]
  if (!userId) {
    console.error('Error: Please provide your User ID as an argument.')
    console.error('Usage: node verify-realtime.js <YOUR_USER_ID>')
    console.error('You can find your User ID in the "Profile" section or usually in the URL or local storage.')
    process.exit(1)
  }

  console.log(`Using User ID: ${userId}`)
  console.log('Creating "REALTIME TEST" budget...')

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      user_id: userId,
      name: 'REALTIME TEST',
      category: 'Test',
      amount: 9999,
      period: 'monthly',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      spent: 0
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create budget:', error.message)
    console.error('Hint: Make sure RLS policies allow creating budgets, or that the User ID is correct.')
    process.exit(1)
  }

  console.log('✅ Budget created! Check your dashboard. It should appear now.')
  console.log('Waiting 5 seconds before cleanup...')

  await new Promise(resolve => setTimeout(resolve, 5000))

  console.log('Deleting "REALTIME TEST" budget...')
  const { error: deleteError } = await supabase
    .from('budgets')
    .delete()
    .eq('id', data.id)

  if (deleteError) {
    console.error('Failed to delete budget:', deleteError.message)
  } else {
    console.log('✅ Budget deleted! It should disappear from your dashboard.')
  }
}

runVerification()
