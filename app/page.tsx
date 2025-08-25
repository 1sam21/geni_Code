"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Sparkles, Code2, Rocket } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)

    try {
      // Store the initial message in sessionStorage for the chat page
      sessionStorage.setItem("initialMessage", input.trim())
      router.push("/chat")
    } catch (error) {
      console.error("Navigation error:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Code2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CodeCraft AI
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-2">Your AI-powered coding companion</p>
          <p className="text-muted-foreground">
            Tell me what you want to create, and I'll help you build it step by step
          </p>
        </div>

        {/* Main Chat Interface */}
        <Card className="p-8 shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="project-input" className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Hi there! What do you want to create today?
              </label>
              <Textarea
                id="project-input"
                placeholder="e.g., Create a to-do list app with user authentication, Build a weather dashboard, Make a portfolio website..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-32 text-base resize-none border-2 border-border/50 focus:border-primary/50 rounded-lg"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing your idea...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Let's Build It!
                </div>
              )}
            </Button>
          </form>
        </Card>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          {[
            {
              icon: Code2,
              title: "Smart Code Editor",
              desc: "Syntax highlighting & auto-completion",
              href: "/dashboard",
            },
            { icon: Sparkles, title: "AI Assistant", desc: "Get help with debugging & optimization", href: "/chat" },
            { icon: Rocket, title: "One-Click Deploy", desc: "Publish your projects instantly", href: "/dashboard" },
          ].map((feature, index) => (
            <Link key={index} href={feature.href}>
              <Card className="p-4 text-center hover:shadow-lg transition-all duration-200 hover:scale-105 border-0 bg-card/30 cursor-pointer group">
                <feature.icon className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
