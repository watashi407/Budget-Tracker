import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vsfiksmbacwstzttopag.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzZmlrc21iYWN3c3R6dHRvcGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzE4NjQsImV4cCI6MjA4MDAwNzg2NH0.qLq1UjVPpUKF1vs-NsmvUUwW4cFcGBW1MKyGF2Z0uIs'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    const userId = 'a554453f-ba17-4501-9714-536c2ce84228'
    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1)

    const input = {
        user_id: userId,
        name: 'Test Budget Script',
        category: 'Test',
        amount: 100,
        spent: 0,
        period: 'monthly',
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        color: '#000000',
        icon: 'wallet'
    }

    console.log('Inserting budget:', input)

    const { data, error } = await supabase
        .from('budgets')
        .insert(input)
        .select()
        .single()

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Success:', data)
    }
}

main()
