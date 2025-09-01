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
import { useRouter } from "next/navigation"
import { db } from "@/lib/database"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { choosePathForNewFile, sanitizeFilePath } from "@/lib/naming"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  model?: string
}

const MODEL_OPTIONS = [
  { key: "auto", label: "Auto" },
  { key: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { key: "x-ai/grok-code-fast", label: "Grok Code Fast" },
  { key: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { key: "openai/gpt-4o", label: "GPT-4o" },
  { key: "google/gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { key: "meta-llama/llama-3.1-70b-instruct", label: "Llama 70B" },
] as const

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window === "undefined") return "auto"
    return sessionStorage.getItem("selectedModel") || "auto"
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem("chat.messages")
      if (raw) {
        const stored: any[] = JSON.parse(raw)
        const revived = stored.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
        setMessages(revived)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const initialMessage = sessionStorage.getItem("initialMessage")
    if (initialMessage) {
      sessionStorage.removeItem("initialMessage")
      setInput(initialMessage)
      setTimeout(() => {
        if (textareaRef.current) {
          // Focus the textarea and trigger form submission through React
          textareaRef.current.focus()
          // Use React's form submission instead of manual DOM event dispatch
          const form = textareaRef.current.closest("form")
          if (form) {
            const submitEvent = new Event("submit", { bubbles: true, cancelable: true })
            form.dispatchEvent(submitEvent)
          }
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

    const currentInput = input.trim()

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: currentInput,
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
          ...(typeof window !== "undefined" && sessionStorage.getItem("openrouterKey")
            ? { "x-openrouter-key": sessionStorage.getItem("openrouterKey") as string }
            : {}),
          ...(selectedModel && selectedModel !== "auto" ? { "x-model": selectedModel } : {}),
        },
        body: JSON.stringify({
          message: currentInput,
          useMultipleModels: selectedModel === "auto",
          model: selectedModel,
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
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content)
        setCopiedId(messageId)
        setTimeout(() => setCopiedId(null), 2000)
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea")
        textArea.value = content
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        setCopiedId(messageId)
        setTimeout(() => setCopiedId(null), 2000)
      }
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const containsCodeBlock = (text: string) => /```[\s\S]*?```/.test(text)

  type ExtractedBlock = { lang: string; code: string; fileName?: string }

  const extractCodeBlocks = (text: string): ExtractedBlock[] => {
    const blocks: ExtractedBlock[] = []
    const regex = /```(\w+)?\s*([\s\S]*?)```/g
    let match
    while ((match = regex.exec(text)) !== null) {
      const lang = (match[1] || "text").toLowerCase()
      let code = match[2] || ""
      // Detect file name hints in first few lines
      const lines = code.split("\n")
      const firstLines = lines.slice(0, 3).join("\n")
      const fileHint = /(?:^|\s)(?:file(?:name)?|path)\s*[:=]\s*([A-Za-z0-9_./-]+\.[A-Za-z0-9]+)/im.exec(
        firstLines,
      )?.[1]
      const fileName = fileHint
      if (fileHint) {
        // Strip the hint line from code
        code = lines
          .filter((l) => !l.toLowerCase().includes("file:") && !l.toLowerCase().includes("filename:"))
          .join("\n")
      }
      blocks.push({ lang, code, fileName })
    }
    return blocks
  }

  const defaultFilenameForLang = (lang: string, index: number) => {
    switch (lang) {
      case "javascript":
      case "js":
        return index === 0 ? "src/index.js" : `src/module${index}.js`
      case "typescript":
      case "ts":
        return index === 0 ? "src/index.ts" : `src/module${index}.ts`
      case "tsx":
        return index === 0 ? "src/App.tsx" : `src/Component${index}.tsx`
      case "jsx":
        return index === 0 ? "src/App.jsx" : `src/Component${index}.jsx`
      case "html":
        return index === 0 ? "index.html" : `page${index}.html`
      case "css":
        return index === 0 ? "styles.css" : `styles${index}.css`
      case "python":
      case "py":
        return index === 0 ? "main.py" : `script${index}.py`
      case "java":
        return index === 0 ? "Main.java" : `Main${index}.java`
      case "cpp":
        return index === 0 ? "main.cpp" : `module${index}.cpp`
      case "go":
        return index === 0 ? "main.go" : `file${index}.go`
      case "rust":
      case "rs":
        return index === 0 ? "main.rs" : `file${index}.rs`
      case "php":
        return index === 0 ? "index.php" : `file${index}.php`
      case "json":
        return index === 0 ? "data.json" : `data${index}.json`
      case "markdown":
      case "md":
        return index === 0 ? "README.md" : `NOTES${index}.md`
      default:
        return index === 0 ? "file.txt" : `file${index}.txt`
    }
  }

  const createProjectFromAssistant = (userPrompt: string, aiContent: string) => {
    const blocks = extractCodeBlocks(aiContent)
    const files: Record<string, string> = {}
    if (blocks.length === 0) {
      // Put entire content into a README if no blocks
      files["/README.md"] = aiContent
    } else {
      const usedNames = new Set<string>()
      blocks.forEach((b, i) => {
        let path = b.fileName
          ? sanitizeFilePath(b.fileName)
          : choosePathForNewFile(b.lang, b.code, i === 0 ? userPrompt : undefined)

        const dedupe = (p: string) => {
          if (!usedNames.has(p) && !files[p]) return p
          const dot = p.lastIndexOf(".")
          const base = dot > -1 ? p.slice(0, dot) : p
          const ext = dot > -1 ? p.slice(dot) : ""
          let n = 1
          let candidate = `${base}-${n}${ext}`
          while (usedNames.has(candidate) || files[candidate]) {
            n++
            candidate = `${base}-${n}${ext}`
          }
          return candidate
        }
        path = dedupe(path)

        usedNames.add(path)
        files[path] = b.code
      })
    }

    const projectName = (userPrompt || "AI Project").slice(0, 40)
    const template = blocks[0]?.lang || "mixed"
    const newProjectId = db.createProject(projectName || "AI Project", template, files)
    return newProjectId
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
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent" aria-label="Select model">
                    <Bot className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {MODEL_OPTIONS.find((m) => m.key === selectedModel)?.label || "Model"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {MODEL_OPTIONS.map((m) => (
                    <DropdownMenuItem
                      key={m.key}
                      onClick={() => {
                        setSelectedModel(m.key)
                        if (typeof window !== "undefined") sessionStorage.setItem("selectedModel", m.key)
                      }}
                    >
                      {m.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" />
              AI Powered
            </Badge>
          </div>
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
