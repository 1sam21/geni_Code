import { NextResponse } from "next/server"

type DeployFile = { path: string; content: string }
type Payload = {
  deploymentId?: string
  projectId?: string
  owner: string
  repo: string
  branch?: string
  token: string
  createRepo?: boolean
  files?: DeployFile[] // optional override
}

async function createRepoIfNeeded(owner: string, repo: string, token: string) {
  // try get; if 404 and we want to create, create the repo
  const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    cache: "no-store",
  })
  if (getRes.ok) return true
  if (getRes.status !== 404) return false
  // try create under authenticated user
  const createRes = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: repo, private: false }),
  })
  return createRes.ok
}

async function putFile(owner: string, repo: string, branch: string, token: string, file: DeployFile, message: string) {
  // first get existing sha (if any)
  const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(file.path)}?ref=${encodeURIComponent(branch)}`
  const getRes = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    cache: "no-store",
  })
  let sha: string | undefined
  if (getRes.ok) {
    const j = await getRes.json()
    if (j?.sha) sha = j.sha
  }
  const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(file.path)}`

  let contentB64: string
  const c = file.content || ""
  const idx = c.indexOf("base64,")
  if (c.startsWith("data:") && idx !== -1) {
    contentB64 = c.slice(idx + "base64,".length) // raw base64 bytes already
  } else {
    // treat as text
    contentB64 = Buffer.from(c, "utf-8").toString("base64")
  }

  const res = await fetch(putUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content: contentB64,
      branch,
      sha,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub put failed for ${file.path}: ${res.status} ${err}`)
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload
    const { owner, repo, token } = body
    const branch = body.branch || "main"
    if (!owner || !repo || !token) {
      return NextResponse.json({ error: "Missing owner/repo/token" }, { status: 400 })
    }

    // Build files from provided list or from deployment snapshot in local DB proxy.
    let files: DeployFile[] = []
    if (Array.isArray(body.files) && body.files.length) {
      files = body.files
    } else {
      // Since we don’t have server-side access to localStorage, expect the client to send files
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const ok = await createRepoIfNeeded(owner, repo, token)
    if (!ok) {
      return NextResponse.json({ error: "Repository not found and could not be created" }, { status: 400 })
    }

    for (const f of files) {
      // normalize leading slash
      const path = f.path?.replace(/^\//, "") || "index.html"
      await putFile(owner, repo, branch, token, { path, content: f.content ?? "" }, "chore: deploy from app")
    }

    return NextResponse.json({ ok: true, url: `https://github.com/${owner}/${repo}/tree/${branch}` })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "GitHub deploy failed" }, { status: 500 })
  }
}
