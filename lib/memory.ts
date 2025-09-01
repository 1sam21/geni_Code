// A light wrapper around localStorage. No external services required.

type Role = "system" | "user" | "assistant"

export interface ChatMessage {
  id: string
  role: Role
  content: string
  createdAt: number
}

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
  memory?: {
    summary?: string
    keywords?: string[]
  }
  settings?: {
    useMemory?: boolean
  }
}

const KEY = "v0.chat.conversations"
const SETTINGS_KEY = "v0.chat.settings"

function safeParse<T>(v: string | null, fallback: T): T {
  if (!v) return fallback
  try {
    return JSON.parse(v) as T
  } catch {
    return fallback
  }
}

function readAll(): Record<string, Conversation> {
  if (typeof window === "undefined") return {}
  return safeParse<Record<string, Conversation>>(window.localStorage.getItem(KEY), {})
}

function writeAll(data: Record<string, Conversation>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(data))
}

function readSettings(): { useMemory: boolean } {
  if (typeof window === "undefined") return { useMemory: true }
  return safeParse<{ useMemory: boolean }>(window.localStorage.getItem(SETTINGS_KEY), { useMemory: true })
}

function writeSettings(s: { useMemory: boolean }) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export function getUseMemory(): boolean {
  return readSettings().useMemory
}

export function setUseMemory(v: boolean) {
  const s = readSettings()
  s.useMemory = v
  writeSettings(s)
}

export function listConversations(): Conversation[] {
  const all = readAll()
  return Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getConversation(id: string): Conversation | undefined {
  return readAll()[id]
}

export function createConversation(title = "New Chat"): Conversation {
  const id = crypto.randomUUID()
  const now = Date.now()
  const conv: Conversation = {
    id,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
    memory: { summary: "", keywords: [] },
    settings: { useMemory: getUseMemory() },
  }
  const all = readAll()
  all[id] = conv
  writeAll(all)
  return conv
}

export function getOrCreateConversation(existingId?: string): Conversation {
  if (existingId) {
    const c = getConversation(existingId)
    if (c) return c
  }
  return createConversation()
}

export function appendMessage(convId: string, m: Omit<ChatMessage, "id" | "createdAt">): Conversation | undefined {
  const all = readAll()
  const conv = all[convId]
  if (!conv) return undefined
  const msg: ChatMessage = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    ...m,
  }
  conv.messages.push(msg)
  conv.updatedAt = Date.now()
  all[convId] = conv
  writeAll(all)
  return conv
}

export function setSummary(convId: string, summary: string, keywords: string[] = []) {
  const all = readAll()
  const conv = all[convId]
  if (!conv) return
  conv.memory = { summary, keywords }
  conv.updatedAt = Date.now()
  all[convId] = conv
  writeAll(all)
}

export function clearConversation(convId: string) {
  const all = readAll()
  if (!all[convId]) return
  delete all[convId]
  writeAll(all)
}

export function renameConversation(convId: string, title: string) {
  const all = readAll()
  const conv = all[convId]
  if (!conv) return
  conv.title = title
  conv.updatedAt = Date.now()
  all[convId] = conv
  writeAll(all)
}
