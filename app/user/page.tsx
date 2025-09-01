"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserProfile, saveUserProfile, type UserProfile } from "@/lib/database"
import Image from "next/image"

export default function UserPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setProfile(getUserProfile() || { id: "local-user", updatedAt: Date.now() })
  }, [])

  const onChange = (field: keyof UserProfile, value: string) => {
    setProfile((p) => (p ? { ...p, [field]: value } : p))
  }

  const onSave = () => {
    if (!profile) return
    setSaving(true)
    const next = saveUserProfile(profile)
    setProfile(next || profile)
    setSaving(false)
  }

  return (
    <main className="container mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl || "/placeholder.svg"}
                  alt="Avatar"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-muted-foreground text-sm">No Avatar</div>
              )}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={profile?.name || ""} onChange={(e) => onChange("name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  onChange={(e) => onChange("email", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                value={profile?.avatarUrl || ""}
                onChange={(e) => onChange("avatarUrl", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={profile?.website || ""}
                onChange={(e) => onChange("website", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={profile?.location || ""}
              onChange={(e) => onChange("location", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={profile?.bio || ""} onChange={(e) => onChange("bio", e.target.value)} rows={4} />
          </div>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} aria-label="Save Profile">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
