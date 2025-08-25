import type React from "react"
import { DM_Sans } from "next/font/google"
import "./globals.css"

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
  return (
    <html lang="en" className={`${dmSans.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
