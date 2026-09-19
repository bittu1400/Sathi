"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Field, Input } from "@/components/ui/field"
import { Logo } from "@/components/ui/logo"
import { Panel } from "@/components/ui/panel"
import { safeNext } from "@/lib/safe-next"

const DEMO_GMAIL = process.env.NEXT_PUBLIC_DEMO_GMAIL ?? ""
const demoEmail = (tag: string) => {
  const [local, domain] = DEMO_GMAIL.split("@")
  return `${local}+${tag}@${domain}`
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get("next"))
  const authError = searchParams.get("error")

  const [isSignUp, setIsSignUp] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(
    authError === "unauthorized" ? "You do not have permission to access that page." : null
  )

  // Quick logins only for the presenter: env on, plus ?demo=1 in the URL.
  const isDemo = process.env.NEXT_PUBLIC_DEMO === "1" && DEMO_GMAIL.includes("@") && searchParams.get("demo") === "1"

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    try {
      const supabase = createClient()
      if (isSignUp) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || "Trekker",
            },
          },
        })
        if (signUpError) throw signUpError
        // "Confirm email" is on for this project: no session until the link is clicked.
        if (!signUpData.session) {
          setNotice("Account created. Check your email for the confirmation link, then sign in.")
          setIsSignUp(false)
          return
        }
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
          const { data: profile, error: roleError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", signInData.user.id)
            .single()
          // Don't guess a destination: a coordinator sent to /trek by a failed lookup is stuck.
          if (roleError) throw new Error("Signed in, but we couldn't load your role. Press Sign in again to retry.")

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
    <div className="w-full max-w-[400px] space-y-4">
      <div className="flex justify-center">
        <Logo />
      </div>
      <Panel className="space-y-5">
        <div className="space-y-1">
          <h1 className="text-h1">{isSignUp ? "Create your account" : "Sign in"}</h1>
          <p className="text-text-muted">
            {isSignUp ? "One account for your treks, check-ins and SOS." : "Your treks, check-ins and SOS are linked to your account."}
          </p>
        </div>

        {error && <Banner severity="danger" headline={error} />}
        {notice && <Banner severity="info" headline={notice} />}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <Field label="Display name" required>
              {(p) => <Input {...p} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Maya Shrestha" autoComplete="name" />}
            </Field>
          )}
          <Field label="Email" required>
            {(p) => <Input {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />}
          </Field>
          <Field label="Password" required>
            {(p) => (
              <div className="relative">
                <Input
                  {...p}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="pr-12"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 flex size-12 cursor-pointer items-center justify-center text-text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
                </button>
              </div>
            )}
          </Field>
          {isSignUp && <p className="text-small text-text-muted">By creating an account you agree to keep your emergency contact accurate. Sathi doesn&apos;t guarantee rescue.</p>}
          <Button type="submit" className="w-full" state={loading ? "busy" : "idle"}>
            {isSignUp ? "Create account" : "Sign in"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
          }}
          className="min-h-12 w-full cursor-pointer text-body font-medium text-accent hover:underline"
        >
          {isSignUp ? "Already have an account? Sign in" : "No account yet? Create one"}
        </button>
      </Panel>

      <p className="text-center">
        <Link href="/routes" className="inline-flex min-h-12 items-center text-body text-text-muted hover:text-text">
          Continue without an account
        </Link>
      </p>

      {isDemo && !isSignUp && (
        <Panel title="Demo logins" meta="Presenter only" className="space-y-3">
          <p className="text-small text-text-muted">Fills the demo email. The password is still required.</p>
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant="secondary" onClick={() => setEmail(demoEmail("trekker"))}>
              Trekker
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEmail(demoEmail("rescue"))}>
              Rescue
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEmail(demoEmail("agency"))}>
              Agency
            </Button>
          </div>
        </Panel>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4">
      <React.Suspense fallback={<p className="text-body text-text-muted">Loading…</p>}>
        <LoginForm />
      </React.Suspense>
    </div>
  )
}
