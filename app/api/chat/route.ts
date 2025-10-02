import { type NextRequest, NextResponse } from "next/server"

const api =
  process.env.OPENROUTER_API_KEY || "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"

const MODELS = [
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o",
  "google/gemini-1.5-flash",
  "meta-llama/llama-3.1-70b-instruct",
  "google/gemini-1.5-pro",
  "x-ai/grok-4",
]

const KNOWN_MODELS = new Set(MODELS)

type ChatMsg = { role: "system" | "user" | "assistant"; content: string }

async function getAIResponse(messages: ChatMsg[], model: string, apiKey: string) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "CodeCraft AI",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.warn(`Model ${model} failed with status ${response.status}: ${errorText}`)
      return null
    }

    const data = await response.json()
    return {
      content: data.choices?.[0]?.message?.content,
      model: data.model || model,
      usage: data.usage,
    }
  } catch (error) {
    console.warn(`Model ${model} failed with error:`, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, useMultipleModels = true, model, models, history = [], memorySummary = "" } = await request.json()
    const headerModel = request.headers.get("x-model") || undefined

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const headerAuth = request.headers.get("x-openrouter-key") || request.headers.get("authorization")
    const apiKey = headerAuth?.toLowerCase().startsWith("bearer ") ? headerAuth.split(" ")[1] : headerAuth || api

    if (!apiKey) {
      return NextResponse.json({ error: "Missing OpenRouter API key" }, { status: 400 })
    }

    const baseSystem: ChatMsg = {
      role: "system",
      content:
        "You are CodeCraft AI, a helpful coding assistant. Help users create, debug, and optimize their code. Provide clear explanations and practical solutions. Be concise but thorough.",
    }
    const memorySystem: ChatMsg | null = memorySummary
      ? { role: "system", content: `Conversation memory summary: ${memorySummary}` }
      : null

    const recentHistory: ChatMsg[] = Array.isArray(history)
      ? history.slice(-10).map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content ?? ""),
        }))
      : []

    const userTurn: ChatMsg = { role: "user", content: String(message) }

    const messagesPayload: ChatMsg[] = [baseSystem, ...(memorySystem ? [memorySystem] : []), ...recentHistory, userTurn]

    const chosenModel = model || headerModel

    // Case 1: Explicit model
    if (chosenModel && KNOWN_MODELS.has(chosenModel)) {
      const single = await getAIResponse(messagesPayload, chosenModel, apiKey)
      if (single?.content) {
        return NextResponse.json({ message: single.content, model: single.model })
      }
    }

    // Case 2: Multi-model strategy
    const candidateModels: string[] = Array.isArray(models) && models.length ? models : MODELS

    if (useMultipleModels) {
      const responses = []
      for (const m of candidateModels.slice(0, 3)) {
        const response = await getAIResponse(messagesPayload, m, apiKey)
        if (response?.content) responses.push(response)
        if (responses.length >= 2) break
      }

      if (!responses.length) {
        const fallbackResponse = await getAIResponse(messagesPayload, "openai/gpt-3.5-turbo", apiKey)
        if (fallbackResponse?.content) {
          return NextResponse.json({
            message: fallbackResponse.content,
            model: fallbackResponse.model,
            alternativeCount: 0,
          })
        }
        return NextResponse.json({ error: "All AI models are currently unavailable" }, { status: 503 })
      }

      const bestResponse = responses.reduce((best, cur) => (cur.content.length > best.content.length ? cur : best))
      return NextResponse.json({
        message: bestResponse.content,
        model: bestResponse.model,
        alternativeCount: responses.length - 1,
      })
    }

    // Case 3: Sequential fallback
    for (const m of candidateModels) {
      const response = await getAIResponse(messagesPayload, m, apiKey)
      if (response?.content) {
        return NextResponse.json({ message: response.content, model: response.model })
      }
    }

    return NextResponse.json({ error: "All AI models are currently unavailable" }, { status: 503 })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
