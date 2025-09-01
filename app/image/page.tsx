"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

type GenResult = { type: "url"; url: string; model: string } | { type: "base64"; dataUrl: string; model: string }

const IMAGE_MODELS = [
  { id: "stability/stable-diffusion-xl", label: "Stable Diffusion XL (Stability)" },
  { id: "stability/stable-diffusion-3.5-large", label: "SD 3.5 Large (Stability)" },
  { id: "fal-ai/flux-pro", label: "FLUX Pro (Fal)" },
  { id: "openai/gpt-image-1", label: "GPT Image (OpenAI)" },
] as const

export default function ImagePage() {
  const router = useRouter()
  const sp = useSearchParams()
  const [prompt, setPrompt] = useState(sp.get("q") || "")
  const [model, setModel] = useState<string>(sp.get("model") || IMAGE_MODELS[0].id)
  const [size, setSize] = useState("1024x1024")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenResult | null>(null)

  const openrouterKey = useMemo(
    () => (typeof window !== "undefined" ? sessionStorage.getItem("OPENROUTER_API_KEY") || "" : ""),
    [],
  )

  async function generate() {
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const resp = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(openrouterKey ? { "x-openrouter-key": openrouterKey } : {}),
        } as any,
        body: JSON.stringify({ prompt, model, size }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data?.error || `Error: ${resp.status}`)
      }
      setResult(data as GenResult)
    } catch (e: any) {
      setError(e?.message || "Failed to generate image")
    } finally {
      setLoading(false)
    }
  }

  async function addToProject() {
    const projectId = (document.getElementById("proj") as HTMLInputElement)?.value?.trim()
    if (!projectId) {
      alert("Enter a Project ID")
      return
    }

    // Save image as file in local DB (best-effort without tight coupling).
    try {
      const fileName = "generated-" + Date.now() + ".png"
      const filePath = `/public/images/${fileName}`

      // Persist using localStorage schema (non-destructive helper).
      const projectsRaw = localStorage.getItem("projects") || "{}"
      const projects = JSON.parse(projectsRaw)

      if (!projects[projectId]) {
        alert("Project not found")
        return
      }

      // Ensure project files map exists
      if (!projects[projectId].files) {
        projects[projectId].files = {}
      }

      const dataUrl = result?.type === "base64" ? result.dataUrl : result?.type === "url" ? result.url : ""

      if (!dataUrl) {
        alert("No image to save")
        return
      }

      projects[projectId].files[filePath] = {
        path: filePath,
        content: dataUrl, // store as Data URL; workspace can render via <img src={content || "/placeholder.svg"} />
        language: "image",
        updatedAt: Date.now(),
      }

      localStorage.setItem("projects", JSON.stringify(projects))
      router.push(`/workspace/${projectId}?open=${encodeURIComponent(filePath)}`)
    } catch (e: any) {
      alert("Failed to save image to project: " + (e?.message || e))
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Image Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A cozy reading nook with warm sunlight and indoor plants, cinematic lighting"
              className="min-h-32"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <select
                id="model"
                className="h-9 rounded-md border bg-background px-2"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {IMAGE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="size">Size</Label>
              <select
                id="size"
                className="h-9 rounded-md border bg-background px-2"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              >
                <option value="512x512">512 × 512</option>
                <option value="768x768">768 × 768</option>
                <option value="1024x1024">1024 × 1024</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="proj">Project ID (optional)</Label>
              <Input id="proj" placeholder="e.g., 1" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={generate} disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </Button>
            <Button variant="secondary" onClick={addToProject} disabled={!result}>
              Add to Project
            </Button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {!!result && (
            <>
              <Separator />
              <div className="rounded-lg border p-4 bg-card">
                {result.type === "base64" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.dataUrl || "/placeholder.svg"}
                    alt="Generated"
                    className="w-full h-auto rounded-md"
                  />
                ) : result.type === "url" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.url || "/placeholder.svg"} alt="Generated" className="w-full h-auto rounded-md" />
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
