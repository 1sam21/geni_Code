// Local storage-based database system for projects and user data
export interface Project {
  id: string
  name: string
  description: string
  template: string
  createdAt: string
  updatedAt: string
  files: Record<string, string>
  isPublic: boolean
  deploymentUrl?: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  theme: "light" | "dark"
  projects: string[]
}

export interface DeploymentSnapshotFile {
  content: string
}

export interface Deployment {
  id: string
  createdAt: string
  projectId?: string
  snapshotFiles: Record<string, DeploymentSnapshotFile>
}

class LocalDatabase {
  private getItem<T>(key: string): T | null {
    if (typeof window === "undefined") return null
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") return
    localStorage.setItem(key, JSON.stringify(value))
  }

  // User management
  getUser(): User | null {
    return this.getItem<User>("user")
  }

  setUser(user: User): void {
    this.setItem("user", user)
  }

  // Project management
  getProjects(): Project[] {
    return this.getItem<Project[]>("projects") || []
  }

  getProject(id: string): Project | null {
    const projects = this.getProjects()
    return projects.find((p) => p.id === id) || null
  }

  saveProject(project: Project): void {
    const projects = this.getProjects()
    const index = projects.findIndex((p) => p.id === project.id)

    if (index >= 0) {
      projects[index] = { ...project, updatedAt: new Date().toISOString() }
    } else {
      projects.push(project)
    }

    this.setItem("projects", projects)
  }

  deleteProject(id: string): void {
    const projects = this.getProjects().filter((p) => p.id !== id)
    this.setItem("projects", projects)
  }

  // Deployment simulation
  deployProject(projectId: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const deploymentUrl = `https://my-project-${projectId.slice(0, 8)}.vercel.app`
        const project = this.getProject(projectId)
        if (project) {
          project.deploymentUrl = deploymentUrl
          this.saveProject(project)
        }
        resolve(deploymentUrl)
      }, 2000)
    })
  }

  // Helper to create a project with initial files
  createProject(name: string, template: string, files: Record<string, string>): string {
    const id = Date.now().toString()
    const now = new Date().toISOString()
    const project: Project = {
      id,
      name: name || "Untitled",
      description: "",
      template,
      createdAt: now,
      updatedAt: now,
      files: files || {},
      isPublic: false,
    }
    this.saveProject(project)
    return id
  }
}

function getAllDeployments(): Record<string, Deployment> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem("deployments")
    return raw ? (JSON.parse(raw) as Record<string, Deployment>) : {}
  } catch {
    return {}
  }
}

function setAllDeployments(value: Record<string, Deployment>) {
  if (typeof window === "undefined") return
  localStorage.setItem("deployments", JSON.stringify(value))
}

/**
 * Save a deployment snapshot for later retrieval (optional helper).
 */
export function saveDeployment(deployment: Deployment) {
  const all = getAllDeployments()
  all[deployment.id] = deployment
  setAllDeployments(all)
}

/**
 * Return a deployment by id.
 * Falls back to synthesizing from a project with the same id if no stored deployment exists.
 */
export function getDeployment(id: string): Deployment | null {
  // Try stored deployment first
  const all = getAllDeployments()
  if (all[id]) return all[id]

  // Fallback: if a project with the same id exists, convert its files to snapshotFiles structure
  const project = db.getProject(id)
  if (project) {
    const snapshotFiles: Record<string, DeploymentSnapshotFile> = {}
    for (const [path, content] of Object.entries(project.files || {})) {
      snapshotFiles[path] = { content: content ?? "" }
    }
    return {
      id,
      createdAt: new Date().toISOString(),
      projectId: project.id,
      snapshotFiles,
    }
  }

  return null
}

export const db = new LocalDatabase()
