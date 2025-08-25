import { type NextRequest, NextResponse } from "next/server"

const OPENROUTER_API_KEY = "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"

const MODELS = [
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o",
  "google/gemini-pro-1.5",
  "meta-llama/llama-3.1-70b-instruct",
]

async function getAIResponse(message: string, model: string) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "CodeCraft AI",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are CodeCraft AI, a helpful coding assistant. Help users create, debug, and optimize their code. Provide clear explanations and practical solutions. Be concise but thorough.",
          },
          {
            role: "user",
            content: message,
          },
        ],
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
    const { message, useMultipleModels = true } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (useMultipleModels) {
      const responses = []
      for (const model of MODELS.slice(0, 3)) {
        const response = await getAIResponse(message, model)
        if (response && response.content) {
          responses.push(response)
        }
        // Stop after getting 2 successful responses
        if (responses.length >= 2) break
      }

      if (responses.length === 0) {
        const fallbackResponse = await getAIResponse(message, "openai/gpt-3.5-turbo")
        if (fallbackResponse && fallbackResponse.content) {
          return NextResponse.json({
            message: fallbackResponse.content,
            model: fallbackResponse.model,
            alternativeCount: 0,
          })
        }
        return NextResponse.json({ error: "All AI models are currently unavailable" }, { status: 503 })
      }

      // Choose the longest response as it's likely more comprehensive
      const bestResponse = responses.reduce((best, current) =>
        current.content.length > best.content.length ? current : best,
      )

      return NextResponse.json({
        message: bestResponse.content,
        model: bestResponse.model,
        alternativeCount: responses.length - 1,
      })
    } else {
      for (const model of MODELS) {
        const response = await getAIResponse(message, model)
        if (response && response.content) {
          return NextResponse.json({
            message: response.content,
            model: response.model,
          })
        }
      }

      return NextResponse.json({ error: "All AI models are currently unavailable" }, { status: 503 })
    }
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
