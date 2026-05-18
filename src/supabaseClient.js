import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://aphjykwyyailgvsuzvhm.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaGp5a3d5eWFpbGd2c3V6dmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4Mzc1MjMsImV4cCI6MjA5NDQxMzUyM30.-DiN9apPrUvCrp6Jca5W9QQWj65d2jlAPEf_LjeeUAQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
