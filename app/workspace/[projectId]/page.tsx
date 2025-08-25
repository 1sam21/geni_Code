"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import {
  Code2,
  Play,
  Save,
  Settings,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Terminal,
  Eye,
  MessageSquare,
  ArrowLeft,
  Rocket,
} from "lucide-react"
import Link from "next/link"
import { DeploymentPanel } from "@/components/deployment-panel"
import { db, type Project } from "@/lib/database"

interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  content?: string
  children?: FileNode[]
}

const mockFileStructure: FileNode[] = [
  {
    id: "1",
    name: "src",
    type: "folder",
    children: [
      {
        id: "2",
        name: "components",
        type: "folder",
        children: [
          {
            id: "3",
            name: "Header.tsx",
            type: "file",
            content:
              'import React from "react";\n\nexport default function Header() {\n  return (\n    <header className="bg-white shadow">\n      <h1>My App</h1>\n    </header>\n  );\n}',
          },
          {
            id: "4",
            name: "Footer.tsx",
            type: "file",
            content:
              'import React from "react";\n\nexport default function Footer() {\n  return (\n    <footer className="bg-gray-100 p-4">\n      <p>&copy; 2024 My App</p>\n    </footer>\n  );\n}',
          },
        ],
      },
      {
        id: "5",
        name: "App.tsx",
        type: "file",
        content:
          'import React from "react";\nimport Header from "./components/Header";\nimport Footer from "./components/Footer";\n\nfunction App() {\n  return (\n    <div className="App">\n      <Header />\n      <main>\n        <h1>Welcome to My App</h1>\n      </main>\n      <Footer />\n    </div>\n  );\n}\n\nexport default App;',
      },
    ],
  },
  {
    id: "6",
    name: "package.json",
    type: "file",
    content:
      '{\n  "name": "my-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.0.0",\n    "react-dom": "^18.0.0"\n  }\n}',
  },
  {
    id: "7",
    name: "README.md",
    type: "file",
    content:
      "# My App\n\nThis is a sample React application.\n\n## Getting Started\n\n1. Install dependencies: `npm install`\n2. Start the development server: `npm start`\n3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.",
  },
]

export default function WorkspacePage({ params }: { params: { projectId: string } }) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["1", "2"]))
  const [project, setProject] = useState<Project | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [fileStructure, setFileStructure] = useState<FileNode[]>(mockFileStructure)
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [newFileType, setNewFileType] = useState<"file" | "folder">("file")
  const [aiMessages, setAiMessages] = useState<Array<{ id: string; role: "user" | "assistant"; content: string }>>([])
  const [aiInput, setAiInput] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [executionOutput, setExecutionOutput] = useState("")
  const [currentLanguage, setCurrentLanguage] = useState("javascript")

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  useEffect(() => {
    const loadProject = () => {
      const projectData = db.getProject(params.projectId)
      if (projectData) {
        setProject(projectData)
      }
    }
    loadProject()
  }, [params.projectId])

  const saveProject = async () => {
    if (!project) return

    setIsSaving(true)
    try {
      const updatedProject = {
        ...project,
        files: {
          ...project.files,
          [selectedFile?.name || "untitled"]: fileContent,
        },
      }

      db.saveProject(updatedProject)
      setProject(updatedProject)
    } catch (error) {
      console.error("Failed to save project:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const selectFile = (file: FileNode) => {
    if (file.type === "file") {
      setSelectedFile(file)
      setFileContent(file.content || "")
      setCurrentLanguage(getLanguageFromFile(file.name))
    }
  }

  const createNewFile = () => {
    if (!newFileName.trim()) return

    let fileName = newFileName.trim()
    if (newFileType === "file" && !fileName.includes(".")) {
      fileName += ".js"
    }

    const newFile: FileNode = {
      id: Date.now().toString(),
      name: fileName,
      type: newFileType,
      content: newFileType === "file" ? getDefaultContent(fileName) : undefined,
      children: newFileType === "folder" ? [] : undefined,
    }

    setFileStructure((prev) => [...prev, newFile])
    setShowNewFileDialog(false)
    setNewFileName("")

    if (newFileType === "file") {
      setSelectedFile(newFile)
      setFileContent(newFile.content || "")
      setCurrentLanguage(getLanguageFromFile(fileName))
    }
  }

  const sendAiMessage = async () => {
    if (!aiInput.trim() || isAiLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: aiInput.trim(),
    }

    setAiMessages((prev) => [...prev, userMessage])
    setAiInput("")
    setIsAiLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Context: I'm working on a ${project?.language || "web"} project called "${project?.name || "Untitled"}". Current file: ${selectedFile?.name || "none"}. Question: ${userMessage.content}`,
          useMultipleModels: true,
        }),
      })

      const data = await response.json()

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: data.message || "Sorry, I couldn't process your request.",
      }

      setAiMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("AI chat error:", error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: "Sorry, I encountered an error. Please try again.",
      }
      setAiMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsAiLoading(false)
    }
  }

  const runCode = async () => {
    if (!selectedFile || !fileContent.trim()) {
      setExecutionOutput("No file selected or file is empty")
      return
    }

    setIsRunning(true)
    setExecutionOutput("Running code...")

    try {
      const language = getLanguageFromFile(selectedFile.name)

      let output = ""

      switch (language) {
        case "javascript":
        case "typescript":
          try {
            const result = eval(fileContent)
            output = `Output: ${result !== undefined ? result : "Code executed successfully"}`
          } catch (error) {
            output = `Error: ${error}`
          }
          break

        case "python":
          output = `Python execution simulated.\nCode:\n${fileContent}\n\nNote: Python execution requires a backend server.`
          break

        case "html":
          output = `HTML file ready for preview. Switch to Preview tab to see the result.`
          break

        case "css":
          output = `CSS file processed. Apply to HTML file to see styling.`
          break

        case "json":
          try {
            JSON.parse(fileContent)
            output = `Valid JSON format ✓`
          } catch (error) {
            output = `Invalid JSON: ${error}`
          }
          break

        default:
          output = `${language} file processed. Language: ${language}`
      }

      setExecutionOutput(output)
    } catch (error) {
      setExecutionOutput(`Execution error: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id} style={{ marginLeft: `${depth * 16}px` }}>
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 ${
            selectedFile?.id === node.id ? "bg-primary/10" : ""
          }`}
          onClick={() => {
            if (node.type === "folder") {
              toggleFolder(node.id)
            } else {
              selectFile(node)
            }
          }}
        >
          {node.type === "folder" ? (
            expandedFolders.has(node.id) ? (
              <FolderOpen className="w-4 h-4 text-primary" />
            ) : (
              <Folder className="w-4 h-4 text-primary" />
            )
          ) : (
            <FileText className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm">{node.name}</span>
        </div>
        {node.type === "folder" && expandedFolders.has(node.id) && node.children && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ))
  }

  const getLanguageFromFile = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    const languageMap: { [key: string]: string } = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      java: "java",
      cpp: "cpp",
      c: "c",
      php: "php",
      rb: "ruby",
      go: "go",
      rs: "rust",
      sql: "sql",
      sh: "bash",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
    }
    return languageMap[extension || ""] || "text"
  }

  const getDefaultContent = (fileName: string): string => {
    const language = getLanguageFromFile(fileName)

    const templates: { [key: string]: string } = {
      javascript: '// JavaScript file\nconsole.log("Hello, World!");\n\n// Your code here...',
      typescript:
        '// TypeScript file\ninterface User {\n  name: string;\n  age: number;\n}\n\nconst user: User = {\n  name: "John",\n  age: 30\n};\n\nconsole.log(user);',
      python: '# Python file\nprint("Hello, World!")\n\n# Your code here...',
      html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>',
      css: "/* CSS file */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    background-color: #f5f5f5;\n}\n\nh1 {\n    color: #333;\n    text-align: center;\n}",
      json: '{\n  "name": "My Project",\n  "version": "1.0.0",\n  "description": "A sample project"\n}',
      java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
      go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
      rust: 'fn main() {\n    println!("Hello, World!");\n}',
      php: '<?php\necho "Hello, World!";\n?>',
      ruby: 'puts "Hello, World!"\n\n# Your Ruby code here...',
    }

    return templates[language] || `// ${language} file\n// Your code here...`
  }

  const getCodeSuggestions = async (code: string, cursorPos: number) => {
    if (!code.trim() || isLoadingSuggestions) return

    setIsLoadingSuggestions(true)

    try {
      const beforeCursor = code.substring(0, cursorPos)
      const afterCursor = code.substring(cursorPos)
      const currentLine = beforeCursor.split("\n").pop() || ""

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Provide code autocompletion suggestions for ${currentLanguage}. 
          Current code context:
          \`\`\`${currentLanguage}
          ${beforeCursor}[CURSOR]${afterCursor}
          \`\`\`
          
          Current line: "${currentLine}"
          
          Please provide 3-5 short, relevant code completions that would logically follow. 
          Return only the completion text, one per line, no explanations.
          Focus on: variable names, function calls, method completions, syntax completions.`,
          useMultipleModels: false,
        }),
      })

      const data = await response.json()
      const suggestionText = data.message || ""
      const suggestionList = suggestionText
        .split("\n")
        .filter((s: string) => s.trim() && !s.includes("```"))
        .slice(0, 5)
        .map((s: string) => s.trim())

      if (suggestionList.length > 0) {
        setSuggestions(suggestionList)
        setShowSuggestions(true)
        setSelectedSuggestion(0)
      }
    } catch (error) {
      console.error("Autocomplete error:", error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const cursorPos = textarea.selectionStart

    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSuggestion((prev) => Math.max(prev - 1, 0))
        return
      }
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault()
        applySuggestion(suggestions[selectedSuggestion])
        return
      }
      if (e.key === "Escape") {
        setShowSuggestions(false)
        return
      }
    }

    // Trigger suggestions with Ctrl+Space
    if (e.ctrlKey && e.key === " ") {
      e.preventDefault()
      getCodeSuggestions(fileContent, cursorPos)
      return
    }

    // Auto-trigger suggestions after typing certain characters
    setTimeout(() => {
      const newCursorPos = textarea.selectionStart
      setCursorPosition(newCursorPos)

      const char = e.key
      if (char === "." || char === "(" || char === " ") {
        getCodeSuggestions(fileContent, newCursorPos)
      } else {
        setShowSuggestions(false)
      }
    }, 10)
  }

  const applySuggestion = (suggestion: string) => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = fileContent.substring(0, start) + suggestion + fileContent.substring(end)

    setFileContent(newContent)
    setShowSuggestions(false)

    // Set cursor position after the inserted suggestion
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + suggestion.length, start + suggestion.length)
    }, 10)
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Code2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold">{project?.name || "Loading..."}</h1>
                <p className="text-sm text-muted-foreground">Project ID: {params.projectId}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
              onClick={saveProject}
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" className="gap-2" onClick={runCode} disabled={isRunning || !selectedFile}>
              <Play className="w-4 h-4" />
              {isRunning ? "Running..." : "Run"}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full border-r bg-card/30">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Explorer</h3>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowNewFileDialog(true)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="p-2">{renderFileTree(fileStructure)}</div>

              {showNewFileDialog && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="p-4 w-80">
                    <h3 className="font-semibold mb-4">Create New {newFileType}</h3>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          variant={newFileType === "file" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewFileType("file")}
                        >
                          File
                        </Button>
                        <Button
                          variant={newFileType === "folder" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewFileType("folder")}
                        >
                          Folder
                        </Button>
                      </div>
                      <Input
                        placeholder={`${newFileType} name...`}
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && createNewFile()}
                      />
                      <div className="flex gap-2">
                        <Button onClick={createNewFile} size="sm">
                          Create
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowNewFileDialog(false)
                            setNewFileName("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Code Editor */}
          <ResizablePanel defaultSize={60}>
            <div className="h-full flex flex-col">
              {selectedFile ? (
                <>
                  <div className="border-b p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{currentLanguage}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Ctrl+Space for suggestions</span>
                        {isLoadingSuggestions && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <span>Getting suggestions...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-4 relative">
                    <textarea
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full h-full resize-none border rounded-lg p-4 font-mono text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder={`Start coding in ${currentLanguage}... (Ctrl+Space for AI suggestions)`}
                      spellCheck={false}
                    />

                    {showSuggestions && suggestions.length > 0 && (
                      <div
                        className="absolute bg-card border rounded-lg shadow-lg z-10 max-w-md"
                        style={{
                          top: "120px",
                          left: "20px",
                        }}
                      >
                        <div className="p-2 border-b text-xs text-muted-foreground font-medium">
                          Code Suggestions (Tab to apply)
                        </div>
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className={`p-3 cursor-pointer text-sm font-mono border-l-2 ${
                              index === selectedSuggestion
                                ? "bg-primary/10 border-primary text-primary"
                                : "border-transparent hover:bg-muted/50"
                            }`}
                            onClick={() => applySuggestion(suggestion)}
                          >
                            {suggestion}
                          </div>
                        ))}
                        <div className="p-2 border-t text-xs text-muted-foreground">
                          ↑↓ Navigate • Tab/Enter Apply • Esc Close
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Code2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select a file to edit</h3>
                    <p className="text-muted-foreground">Choose a file from the explorer to start coding</p>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full border-l">
              <Tabs defaultValue="preview" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="preview" className="gap-1">
                    <Eye className="w-3 h-3" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="terminal" className="gap-1">
                    <Terminal className="w-3 h-3" />
                    Terminal
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="gap-1">
                    <MessageSquare className="w-3 h-3" />
                    AI
                  </TabsTrigger>
                  <TabsTrigger value="deploy" className="gap-1">
                    <Rocket className="w-3 h-3" />
                    Deploy
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="flex-1 p-4">
                  <Card className="h-full p-4 flex items-center justify-center">
                    <div className="text-center">
                      <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Preview will appear here</p>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="terminal" className="flex-1 p-4">
                  <Card className="h-full p-4 bg-black text-green-400 font-mono text-sm overflow-y-auto">
                    <div>$ npm start</div>
                    <div>Starting development server...</div>
                    <div>Server running on http://localhost:3000</div>
                    {executionOutput && (
                      <>
                        <div className="mt-4 border-t border-gray-600 pt-2">
                          <div className="text-yellow-400">--- Execution Output ---</div>
                          <pre className="whitespace-pre-wrap text-white mt-2">{executionOutput}</pre>
                        </div>
                      </>
                    )}
                    <div className="mt-2">
                      <span className="text-green-400">$</span>
                      <span className="animate-pulse">_</span>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="ai" className="flex-1 p-4">
                  <div className="h-full flex flex-col">
                    <div className="flex-1 mb-4 overflow-y-auto">
                      {aiMessages.length === 0 ? (
                        <Card className="h-full p-4 flex items-center justify-center">
                          <div className="text-center">
                            <MessageSquare className="w-12 h-12 text-primary mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              AI assistant ready to help with {currentLanguage}
                            </p>
                          </div>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {aiMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-lg ${
                                msg.role === "user" ? "bg-primary text-primary-foreground ml-4" : "bg-muted mr-4"
                              }`}
                            >
                              <div className="text-xs opacity-70 mb-1">{msg.role === "user" ? "You" : "AI"}</div>
                              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                            </div>
                          ))}
                          {isAiLoading && (
                            <div className="bg-muted mr-4 p-3 rounded-lg">
                              <div className="text-xs opacity-70 mb-1">AI</div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                <div
                                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                />
                                <div
                                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask AI..."
                        className="flex-1"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendAiMessage()}
                        disabled={isAiLoading}
                      />
                      <Button size="sm" onClick={sendAiMessage} disabled={isAiLoading}>
                        Send
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="deploy" className="flex-1 p-4">
                  {project && <DeploymentPanel projectId={project.id} projectName={project.name} />}
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
