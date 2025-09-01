"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Code2, Plus, Search, Filter, MoreVertical, Folder, Trash2, Settings, Play, GitBranch } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { db, type Project } from "@/lib/database"

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived" | "template">("all")

  useEffect(() => {
    const loadProjects = () => {
      const savedProjects = db.getProjects()
      if (savedProjects.length === 0) {
        // Create sample projects if none exist
        const sampleProjects: Project[] = [
          {
            id: "1",
            name: "E-commerce Dashboard",
            description: "React dashboard with analytics and user management",
            template: "Next.js",
            createdAt: new Date("2024-01-15").toISOString(),
            updatedAt: new Date("2024-01-15").toISOString(),
            files: {},
            isPublic: false,
          },
          {
            id: "2",
            name: "Weather App",
            description: "Simple weather application with location services",
            template: "React",
            createdAt: new Date("2024-01-10").toISOString(),
            updatedAt: new Date("2024-01-10").toISOString(),
            files: {},
            isPublic: false,
          },
          {
            id: "3",
            name: "Blog Template",
            description: "Minimalist blog template with markdown support",
            template: "Next.js",
            createdAt: new Date("2024-01-05").toISOString(),
            updatedAt: new Date("2024-01-05").toISOString(),
            files: {},
            isPublic: true,
          },
        ]

        sampleProjects.forEach((project) => db.saveProject(project))
        setProjects(sampleProjects)
      } else {
        setProjects(savedProjects)
      }
    }

    loadProjects()
  }, [])

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "template" && project.isPublic) ||
      (filterStatus === "active" && !project.isPublic)
    return matchesSearch && matchesFilter
  })

  const createNewProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: "New Project",
      description: "A new coding project",
      template: "React",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: {},
      isPublic: false,
    }

    db.saveProject(newProject)
    setProjects((prev) => [newProject, ...prev])
  }

  const deleteProject = (projectId: string) => {
    db.deleteProject(projectId)
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
  }

  const getLanguageColor = (template: string) => {
    const colors: Record<string, string> = {
      "Next.js": "bg-blue-500",
      React: "bg-cyan-500",
      Vue: "bg-green-500",
      Angular: "bg-red-500",
      Svelte: "bg-orange-500",
    }
    return colors[template] || "bg-gray-500"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Code2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">CodeCraft AI</h1>
                    <p className="text-sm text-muted-foreground">Project Dashboard</p>
                  </div>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-x-4 gap-y-2 flex-wrap md:flex-nowrap">
              <Link href="/chat">
                <Button
                  variant="outline"
                  size="default"
                  className="h-10 w-10 p-0 hover:bg-muted/50 bg-transparent shrink-0"
                  aria-label="AI Assistant"
                  title="AI Assistant"
                >
                  <Code2 className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                size="default"
                className="h-10 w-10 p-0 shrink-0"
                onClick={createNewProject}
                aria-label="New Project"
                title="New Project"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="default"
                  className="gap-2 bg-transparent hover:bg-muted/50 px-4 py-2 h-10 shrink-0 whitespace-nowrap"
                >
                  <Filter className="w-4 h-4" />
                  {filterStatus === "all"
                    ? "All Projects"
                    : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Projects</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("active")}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("template")}>Templates</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Projects Grid */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Projects</h2>
          <p className="text-muted-foreground">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Folder className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.template}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted/50">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/workspace/${project.id}`}>
                          <Play className="w-4 h-4 mr-2" />
                          Open Project
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <GitBranch className="w-4 h-4 mr-2" />
                        Clone Project
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteProject(project.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getLanguageColor(project.template)}`} />
                  <span className="text-sm font-medium">{project.template}</span>
                </div>
                <Badge variant={project.isPublic ? "secondary" : "outline"}>
                  {project.isPublic ? "template" : "active"}
                </Badge>
              </div>

              <div className="flex flex-wrap md:flex-nowrap gap-3 mt-4">
                <Link href={`/workspace/${project.id}`}>
                  <Button size="default" className="h-9 w-9 p-0 shrink-0" aria-label="Open" title="Open">
                    <Play className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="default"
                  className="h-9 w-9 p-0 hover:bg-muted/50 bg-transparent shrink-0"
                  aria-label="Settings"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <Card className="p-12 text-center">
            <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "Try adjusting your search terms" : "Create your first project to get started"}
            </p>
            <Button size="default" className="gap-2 px-6 py-2" onClick={createNewProject}>
              <Plus className="w-4 h-4" />
              Create New Project
            </Button>
          </Card>
        )}
      </main>
    </div>
  )
}
