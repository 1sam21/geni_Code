import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import ProfileForm from "@/components/profile-form"
import { Card } from "@/components/ui/card"

export default async function ProfilePage() {
  const supabase = getSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) {
    redirect("/auth")
  }

  const meta = (user.user_metadata as any) || {}
  const initial = {
    name: meta.name || "",
    phone: meta.phone || "",
    bio: meta.bio || "",
    email: user.email || "",
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold mb-1">Your Profile</h1>
          <p className="text-muted-foreground mb-4">Update your personal information.</p>
          <ProfileForm initial={initial} />
        </Card>
      </div>
    </main>
  )
}
