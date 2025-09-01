import type React from "react"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider" // import provider

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Keep it on a single line to prevent any whitespace between tags that could cause hydration errors.
  return (
    <html lang="en" className={`${dmSans.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
  generator: "v0.app",
}
