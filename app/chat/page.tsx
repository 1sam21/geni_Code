"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Code2, Send, Bot, User, Sparkles, ArrowLeft, Copy, Check } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  model?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const initialMessage = sessionStorage.getItem("initialMessage")
    if (initialMessage) {
      sessionStorage.removeItem("initialMessage")
      setInput(initialMessage)
      // Auto-submit the initial message
      setTimeout(() => {
        const form = document.querySelector("form")
        if (form) {
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
        }
      }, 100)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        model: data.model,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Code2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">CodeCraft AI</h1>
                <p className="text-sm text-muted-foreground">Your coding companion</p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            AI Powered
          </Badge>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <Card className="p-8 text-center border-dashed">
                <Bot className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to help you code!</h3>
                <p className="text-muted-foreground">
                  Ask me anything about programming, debugging, or building your projects.
                </p>
              </Card>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="p-2 bg-primary/10 rounded-full shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}

                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      <span className="text-sm font-medium">{message.role === "user" ? "You" : "CodeCraft AI"}</span>
                      {message.model && (
                        <Badge variant="outline" className="text-xs">
                          {message.model.split("/").pop()}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(message.content, message.id)}
                    >
                      {copiedId === message.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{message.content}</pre>
                  </div>
                  <div className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</div>
                </Card>

                {message.role === "user" && (
                  <div className="p-2 bg-secondary/10 rounded-full shrink-0">
                    <User className="w-5 h-5 text-secondary" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="p-2 bg-primary/10 rounded-full shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <Card className="max-w-[80%] p-4 bg-card">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <span className="text-sm text-muted-foreground ml-2">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Input Form */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              ref={textareaRef}
              placeholder="Ask me anything about coding..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-12 max-h-32 resize-none"
              disabled={isLoading}
            />
            <Button type="submit" size="lg" disabled={!input.trim() || isLoading} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
