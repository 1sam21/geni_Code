"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { getDeployment } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DeploymentPreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [src, setSrc] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [deployment, setDeployment] = React.useState<any | null>(null)
  const [ghOwner, setGhOwner] = React.useState("")
  const [ghRepo, setGhRepo] = React.useState("")
  const [ghBranch, setGhBranch] = React.useState("main")
  const [ghToken, setGhToken] = React.useState("")
  const [pushing, setPushing] = React.useState(false)
  const [pushError, setPushError] = React.useState<string | null>(null)
  const [pushUrl, setPushUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    try {
      const d = getDeployment(params.id)
      if (!d) {
        setError("Deployment not found")
        return
      }
      setDeployment(d)
      const entry = d.snapshotFiles["index.html"]?.content ?? d.snapshotFiles["public/index.html"]?.content

      let html =
        entry ||
        "<!doctype html><html><head><meta charset='utf-8'><title>Preview</title></head><body><pre>No index.html found in deployment.</pre></body></html>"

      const css = d.snapshotFiles["styles.css"]?.content ?? d.snapshotFiles["style.css"]?.content
      if (css) {
        html = html.replace("</head>", `<style>${css}</style></head>`)
      }
      const js = d.snapshotFiles["main.js"]?.content ?? d.snapshotFiles["app.js"]?.content
      if (js) {
        html = html.replace("</body>", `<script type="module">${js}</script></body>`)
      }

      const blob = new Blob([html], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      setSrc(url)
      return () => URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e?.message ?? "Failed to render deployment")
    }
  }, [params.id])

  function buildFiles() {
    if (!deployment?.snapshotFiles) return []
    const out: { path: string; content: string }[] = []
    for (const [path, file] of Object.entries<any>(deployment.snapshotFiles)) {
      const p = path.replace(/^\//, "")
      const content = typeof file === "string" ? file : (file?.content ?? "")
      out.push({ path: p, content })
    }
    return out
  }

  async function launchOnGitHub() {
    setPushError(null)
    setPushUrl(null)
    if (!ghOwner || !ghRepo || !ghToken) {
      setPushError("Owner, repository, and token are required.")
      return
    }
    const files = buildFiles()
    if (!files.length) {
      setPushError("No files found in deployment snapshot.")
      return
    }
    setPushing(true)
    try {
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: ghOwner,
          repo: ghRepo,
          branch: ghBranch || "main",
          token: ghToken,
          files,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || `GitHub deploy failed (${res.status})`)
      }
      setPushUrl(data?.url || null)
    } catch (e: any) {
      setPushError(e?.message || "Failed to deploy to GitHub")
    } finally {
      setPushing(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-pretty">Deployment {params.id}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()} aria-label="Back">
            Back
          </Button>
          {src && (
            <a href={src} target="_blank" rel="noreferrer">
              <Button size="sm" aria-label="Open in new tab">
                Open
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card/50 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <Label htmlFor="gh-owner">Owner</Label>
            <Input
              id="gh-owner"
              placeholder="e.g. your-github-username"
              value={ghOwner}
              onChange={(e) => setGhOwner(e.target.value)}
              className="h-9 w-56"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="gh-repo">Repo</Label>
            <Input
              id="gh-repo"
              placeholder="e.g. my-app"
              value={ghRepo}
              onChange={(e) => setGhRepo(e.target.value)}
              className="h-9 w-56"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="gh-branch">Branch</Label>
            <Input
              id="gh-branch"
              placeholder="main"
              value={ghBranch}
              onChange={(e) => setGhBranch(e.target.value)}
              className="h-9 w-36"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="gh-token">GitHub Token</Label>
            <Input
              id="gh-token"
              type="password"
              placeholder="repo-scoped token"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              className="h-9 w-72"
            />
          </div>
          <Button
            size="sm"
            onClick={launchOnGitHub}
            disabled={pushing}
            aria-label="Launch on GitHub"
            className="shrink-0"
          >
            {pushing ? "Deploying…" : "Launch on GitHub"}
          </Button>
        </div>
        {pushError && <p className="mt-2 text-sm text-red-600">{pushError}</p>}
        {pushUrl && (
          <p className="mt-2 text-sm">
            Deployed to{" "}
            <a className="underline" href={pushUrl} target="_blank" rel="noreferrer">
              {pushUrl}
            </a>
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 rounded-lg border bg-background overflow-hidden">
        {error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : src ? (
          <iframe title="Deployment Preview" className="w-full h-[75vh]" src={src} />
        ) : (
          <div className="p-4 text-sm text-muted-foreground">Preparing preview…</div>
        )}
      </div>
    </main>
  )
}
