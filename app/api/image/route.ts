import { NextResponse } from "next/server"

type ImageRequest = {
  prompt: string
  model?: string
  size?: "256x256" | "512x512" | "1024x1024"
  // optional img2img support (base64 data URL or raw base64 without prefix)
  imageBase64?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ImageRequest
    const { prompt, model = "stability/stable-diffusion-xl", size = "1024x1024", imageBase64 } = body

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    const keyFromHeader = req.headers.get("x-openrouter-key") || ""
    const apiKey = keyFromHeader || process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || ""

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OpenRouter API key (pass x-openrouter-key header or set env)" },
        { status: 401 },
      )
    }

    // NOTE: OpenRouter image endpoint shape can vary by model.
    // We try the generic /images endpoint first and normalize the response.
    const resp = await fetch("https://openrouter.ai/api/v1/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": req.headers.get("referer") || "https://v0.app",
        "X-Title": "Image Generation",
      },
      body: JSON.stringify({
        model,
        prompt,
        size,
        // Some providers accept input image as 'image' or 'image[]'; we pass a generic field:
        image: imageBase64
          ? imageBase64.startsWith("data:")
            ? imageBase64
            : `data:image/png;base64,${imageBase64}`
          : undefined,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => "")
      return NextResponse.json(
        { error: `Image API error: ${resp.status}`, details: text?.slice(0, 1000) },
        { status: resp.status },
      )
    }

    const data = await resp.json().catch(() => ({}) as any)

    // Normalize common result shapes:
    // 1) { data: [{ url }]} or 2) { data: [{ b64_json }]}
    let imageUrl: string | null = null
    let imageB64: string | null = null

    const first = Array.isArray(data?.data) ? data.data[0] : null
    if (first?.url) imageUrl = first.url
    if (first?.b64_json) imageB64 = first.b64_json

    if (!imageUrl && !imageB64) {
      // Some models return { url } at top-level or { image } fields
      if (data?.url) imageUrl = data.url
      if (data?.image) {
        const img = data.image
        if (typeof img === "string") {
          if (img.startsWith("http")) imageUrl = img
          else imageB64 = img
        }
      }
    }

    if (imageB64) {
      return NextResponse.json({
        type: "base64",
        dataUrl: `data:image/png;base64,${imageB64}`,
        model,
      })
    }

    if (imageUrl) {
      return NextResponse.json({ type: "url", url: imageUrl, model })
    }

    return NextResponse.json({ error: "Unrecognized image response format", raw: data }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: "Unexpected error", message: err?.message || String(err) }, { status: 500 })
  }
}
