"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/trek"
  const authError = searchParams.get("error")

  const [isSignUp, setIsSignUp] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(
    authError === "unauthorized" ? "You do not have permission to access that page." : null
  )

  const isDemo = process.env.NEXT_PUBLIC_DEMO === "1"

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || "Trekker",
            },
          },
        })
        if (signUpError) throw signUpError
        router.push(next)
        router.refresh()
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError

        // Role-based default destination if next is default
        if (!searchParams.get("next")) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", signInData.user.id)
            .single()

          if (profile?.role === "coordinator") {
            router.push("/rescue")
            router.refresh()
            return
          } else if (profile?.role === "agency_admin") {
            router.push("/agency")
            router.refresh()
            return
          }
        }

        router.push(next)
        router.refresh()
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected authentication error occurred.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-6 bg-card border border-border rounded-xl shadow-lg space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {isSignUp ? "Create your Sathi account" : "Welcome back to Sathi"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSignUp
            ? "Sign up for offline trekking intelligence & safety monitoring."
            : "Sign in to access your treks, check-ins, and safety coordination."}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 text-sm rounded-lg bg-destructive/10 border border-destructive text-destructive"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div className="space-y-1">
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-foreground"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Maya Shrestha"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading
            ? "Please wait..."
            : isSignUp
            ? "Create Account"
            : "Sign In"}
        </Button>
      </form>

      <div className="text-center text-sm">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
          }}
          className="text-primary hover:underline font-medium"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </div>

      {isDemo && !isSignUp && (
        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
            Quick Demo Logins
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Pre-fills demo emails (password required).
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEmail("demo+trekker@gmail.com")}
              className="text-xs"
            >
              Trekker
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEmail("demo+rescue@gmail.com")}
              className="text-xs"
            >
              Rescue
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEmail("demo+agency@gmail.com")}
              className="text-xs"
            >
              Agency
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <React.Suspense fallback={<div className="text-sm text-muted-foreground">Loading login...</div>}>
        <LoginForm />
      </React.Suspense>
    </main>
  )
}
