import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options })
        },
      },
    },
  )

  // Attempt to refresh the session. If it fails, the user is signed out.
  await supabase.auth.getSession()
  return res
}

export const config = {
  matcher: [
    // Protect these paths if desired (expand as needed):
    "/user/:path*",
    "/dashboard/:path*",
  ],
}
