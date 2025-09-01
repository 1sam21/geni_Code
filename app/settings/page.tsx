"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { getSettings, saveSettings } from "@/lib/database"

export default function SettingsPage() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [reducedMotion, setReducedMotion] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const s = getSettings()
    if (s?.theme) setTheme(s.theme)
    if (typeof s?.reducedMotion === "boolean") setReducedMotion(s.reducedMotion)
    if (typeof s?.autoSave === "boolean") setAutoSave(s.autoSave)
    if (typeof s?.showLineNumbers === "boolean") setShowLineNumbers(s.showLineNumbers)
    if (typeof s?.loggedIn === "boolean") setLoggedIn(s.loggedIn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persist = (next: Partial<ReturnType<typeof getSettings>>) => {
    saveSettings(next as any)
  }

  const onLogin = () => {
    setLoggedIn(true)
    persist({ loggedIn: true })
  }
  const onLogout = () => {
    setLoggedIn(false)
    persist({ loggedIn: false })
  }

  return (
    <main className="container mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label>Theme</Label>
            <Select
              value={theme as string}
              onValueChange={(v) => {
                setTheme(v as any)
                persist({ theme: v as any })
              }}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Current computed theme: <span className="font-medium">{systemTheme || "system"}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <div className="font-medium">Reduced motion</div>
                <div className="text-sm text-muted-foreground">Minimize animations</div>
              </div>
              <Switch
                checked={reducedMotion}
                onCheckedChange={(v) => {
                  setReducedMotion(v)
                  persist({ reducedMotion: v })
                }}
                aria-label="Toggle reduced motion"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <div className="font-medium">Auto save</div>
                <div className="text-sm text-muted-foreground">Save changes automatically</div>
              </div>
              <Switch
                checked={autoSave}
                onCheckedChange={(v) => {
                  setAutoSave(v)
                  persist({ autoSave: v })
                }}
                aria-label="Toggle auto save"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <div className="font-medium">Show line numbers</div>
                <div className="text-sm text-muted-foreground">Display editor line numbers</div>
              </div>
              <Switch
                checked={showLineNumbers}
                onCheckedChange={(v) => {
                  setShowLineNumbers(v)
                  persist({ showLineNumbers: v })
                }}
                aria-label="Toggle line numbers"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <div className="font-medium">{loggedIn ? "Logged in (local)" : "Logged out"}</div>
                <div className="text-sm text-muted-foreground">Local session for demo (no external auth)</div>
              </div>
              {loggedIn ? (
                <Button variant="secondary" onClick={onLogout} aria-label="Logout">
                  Logout
                </Button>
              ) : (
                <Button onClick={onLogin} aria-label="Login">
                  Login
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
