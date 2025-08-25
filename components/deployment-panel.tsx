"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Rocket, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface DeploymentPanelProps {
  projectId: string
  projectName: string
}

export function DeploymentPanel({ projectId, projectName }: DeploymentPanelProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null)
  const [deploymentStatus, setDeploymentStatus] = useState<"idle" | "deploying" | "success" | "error">("idle")

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeploymentStatus("deploying")

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, projectName }),
      })

      const result = await response.json()

      if (result.success) {
        setDeploymentUrl(result.deploymentUrl)
        setDeploymentStatus("success")
      } else {
        setDeploymentStatus("error")
      }
    } catch (error) {
      setDeploymentStatus("error")
    } finally {
      setIsDeploying(false)
    }
  }

  const getStatusIcon = () => {
    switch (deploymentStatus) {
      case "deploying":
        return <Clock className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Rocket className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    switch (deploymentStatus) {
      case "deploying":
        return "Deploying..."
      case "success":
        return "Deployed"
      case "error":
        return "Failed"
      default:
        return "Ready to deploy"
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Deployment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          <Badge variant={deploymentStatus === "success" ? "default" : "secondary"}>
            {deploymentStatus === "success" ? "Live" : "Draft"}
          </Badge>
        </div>

        {deploymentUrl && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Live URL:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(deploymentUrl, "_blank")}
                className="h-auto p-1"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm font-mono text-primary truncate mt-1">{deploymentUrl}</p>
          </div>
        )}

        <Button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          {isDeploying ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Deploy Project
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Automatic HTTPS and global CDN</p>
          <p>• Zero-config deployments</p>
          <p>• Instant rollbacks available</p>
        </div>
      </CardContent>
    </Card>
  )
}
