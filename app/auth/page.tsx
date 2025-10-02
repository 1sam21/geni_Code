"use client"

import { useEffect, useMemo, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useToast } from "@/hooks/use-toast"

type Stage = "auth" | "verify" | "profile"

export default function AuthPage() {
  const supabase = useMemo(getSupabaseBrowserClient, [])
  const { toast } = useToast()

  const [stage, setStage] = useState<Stage>("auth")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setStage("profile")
        setEmail(data.user.email || "")
        setFullName((data.user.user_metadata?.full_name as string) || "")
        setAvatarUrl((data.user.user_metadata?.avatar_url as string) || "")
      }
    })()
  }, [supabase])

  const handleSignUp = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            (typeof window !== "undefined" &&
              (process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin)) ||
            undefined,
        },
      })
      if (error) throw error

      // Send a one-time code to email (explicit user request for email code)
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (otpError) throw otpError

      toast({ title: "Verification code sent", description: "Check your email for the 6-digit code." })
      setStage("verify")
    } catch (e: any) {
      toast({ title: "Sign up failed", description: e.message || "Please try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // Second step: email OTP verification (app-level)
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      })
      if (otpError) throw otpError

      toast({ title: "Verification code sent", description: "Check your email for the 6-digit code." })
      setStage("verify")
    } catch (e: any) {
      toast({ title: "Sign in failed", description: e.message || "Please try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setLoading(true)
    try {
      // For email OTP, 'email' type is used
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      })
      if (error) throw error

      toast({ title: "Email verified", description: "Verification successful." })
      setStage("profile")

      const userRes = await supabase.auth.getUser()
      if (userRes.data.user) {
        setFullName((userRes.data.user.user_metadata?.full_name as string) || "")
        setAvatarUrl((userRes.data.user.user_metadata?.avatar_url as string) || "")
      }
    } catch (e: any) {
      toast({ title: "Invalid code", description: e.message || "Please try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatarUrl },
      })
      if (error) throw error
      toast({ title: "Profile updated", description: "Your personal data has been saved." })
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message || "Please try again.", variant: "destructive" })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setEmail("")
    setPassword("")
    setCode("")
    setFullName("")
    setAvatarUrl("")
    setStage("auth")
  }

  return (
    <main className="container mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {stage !== "profile" && (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button onClick={handleSignIn} disabled={loading}>
                  {loading ? "Please wait…" : "Sign In"}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input
                    id="email2"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password2">Password</Label>
                  <Input
                    id="password2"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button onClick={handleSignUp} disabled={loading}>
                  {loading ? "Please wait…" : "Create Account"}
                </Button>
              </TabsContent>
            </Tabs>
          )}

          {stage === "verify" && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Enter the 6-digit code sent to {email}</Label>
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleVerifyCode} disabled={loading || code.length !== 6}>
                  {loading ? "Verifying…" : "Verify code"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    setLoading(true)
                    try {
                      const { error } = await supabase.auth.signInWithOtp({
                        email,
                        options: { shouldCreateUser: false },
                      })
                      if (error) throw error
                      toast({ title: "Code sent", description: "We emailed you a new code." })
                    } catch (e: any) {
                      toast({ title: "Resend failed", description: e.message || "Try again.", variant: "destructive" })
                    } finally {
                      setLoading(false)
                    }
                  }}
                >
                  Resend code
                </Button>
              </div>
            </div>
          )}

          {stage === "profile" && (
            <div className="space-y-4">
              <div className="rounded-md border p-4 grid gap-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input value={email} disabled aria-readonly />
                </div>
                <div className="grid gap-2">
                  <Label>Full name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div className="grid gap-2">
                  <Label>Avatar URL</Label>
                  <Input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="/diverse-avatars.png"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Button onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? "Saving…" : "Save personal data"}
                  </Button>
                  <Button variant="secondary" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your personal data is stored in Supabase auth user metadata. Email changes require verification.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
