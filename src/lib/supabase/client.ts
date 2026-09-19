import { createBrowserClient } from "@supabase/ssr"
import { supabaseEnv } from "./env"

export function createClient() {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = supabaseEnv()

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
