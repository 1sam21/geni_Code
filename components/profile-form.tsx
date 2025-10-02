"use client"

import { useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type Props = {
  initial: {
    name: string
    phone: string
    bio: string
    email: string
  }
}

export default function ProfileForm({ initial }: Props) {
  const [name, setName] = useState(initial.name)
  const [phone, setPhone] = useState(initial.phone)
  const [bio, setBio] = useState(initial.bio)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()

  const save = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { name, phone, bio } })
      if (error) throw error
      toast({ title: "Profile updated", description: "Your changes have been saved." })
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message || "Please try again", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const signOut = async () => {
    setSaving(true)
    try {
      await supabase.auth.signOut()
      window.location.href = "/auth"
    } catch {
      setSaving(false)
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={initial.email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="+1 555-123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={signOut} disabled={saving}>
          Sign out
        </Button>
      </div>
    </form>
  )
}
