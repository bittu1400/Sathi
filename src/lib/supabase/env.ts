/**
 * Supabase URL + anon key. A production build with missing env must fail loudly,
 * not talk to a dummy URL and silently drop every SOS.
 */
export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && anonKey) return { url, anonKey }
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set")
  }
  return { url: "http://localhost:54321", anonKey: "local-dev-anon-key" }
}
