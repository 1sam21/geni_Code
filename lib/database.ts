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
}

export const db = new LocalDatabase()
