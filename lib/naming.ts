const KNOWN_EXT: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  typescriptreact: "tsx",
  javascriptreact: "jsx",
  ts: "ts",
  tsx: "tsx",
  js: "js",
  jsx: "jsx",
  html: "html",
  css: "css",
  scss: "scss",
  python: "py",
  py: "py",
  go: "go",
  rust: "rs",
  rs: "rs",
  java: "java",
  c: "c",
  "c++": "cpp",
  cpp: "cpp",
  php: "php",
  ruby: "rb",
  rb: "rb",
  json: "json",
  md: "md",
}

export function kebabCase(input: string) {
  return input
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

export function sanitizeFilePath(path: string) {
  const parts = path
    .split("/")
    .filter(Boolean)
    .map((p, i, arr) => {
      if (i === arr.length - 1 && p.includes(".")) {
        const lastDot = p.lastIndexOf(".")
        const name = p.slice(0, lastDot)
        const ext = p.slice(lastDot + 1).toLowerCase()
        return `${kebabCase(name)}.${ext}`
      }
      return kebabCase(p)
    })
  return `/${parts.join("/")}`
}

export function extForLanguage(lang?: string) {
  if (!lang) return "txt"
  const key = lang.toLowerCase()
  return KNOWN_EXT[key] || "txt"
}

export function inferBaseNameFromContent(language: string | undefined, content: string) {
  const lang = (language || "").toLowerCase()
  if (lang.includes("html")) return "index"
  if (lang.includes("css")) return "styles"
  if (lang.includes("python")) {
    if (/def\s+main\s*\(/.test(content)) return "main"
    return "script"
  }
  if (lang.includes("javascriptreact") || lang.includes("tsx") || lang.includes("jsx")) {
    const m =
      content.match(/export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)/) ||
      content.match(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/)
    if (m) return m[1]
    return "component"
  }
  if (lang.includes("typescript") || lang.includes("javascript") || lang === "js" || lang === "ts") {
    if (/import\s+express/.test(content)) return "server"
    if (/console\.log/.test(content)) return "script"
    return "index"
  }
  if (lang.includes("go")) return "main"
  if (lang.includes("rust") || lang === "rs") return "main"
  if (lang.includes("java")) return "Main"
  if (lang.includes("php")) return "index"
  if (lang.includes("json")) return "data"
  if (lang.includes("md")) return "readme"
  return "file"
}

export function suggestFileName(language: string | undefined, content: string, hint?: string) {
  const ext = extForLanguage(language)
  const baseHint = hint ? kebabCase(hint) : ""
  const base = baseHint || kebabCase(inferBaseNameFromContent(language, content))
  return `${base || "file"}.${ext}`
}

export function choosePathForNewFile(language: string | undefined, content: string, hint?: string) {
  const fileName = suggestFileName(language, content, hint)
  if ((language || "").toLowerCase().includes("html") || (language || "").toLowerCase().includes("css")) {
    return sanitizeFilePath(`/public/${fileName}`)
  }
  return sanitizeFilePath(`/src/${fileName}`)
}
