'use server'

interface App {
  id: string
  spec: {
    name: string
    project_id: string
  }
}

const headers = {
  Authorization: `Bearer ${process.env.DIGITALOCEAN_API_TOKEN}`,
}

export async function listProjects() {
  const response = await fetch('https://api.digitalocean.com/v2/projects', { headers })
  const json = await response.json()
  return json.projects
}

export async function listApps() {
  const response = await fetch('https://api.digitalocean.com/v2/apps', { headers })
  const json = await response.json()
  return json.apps
}

export async function getProjectApps(projectId: string) {
  const apps = await listApps()
  return apps.filter((app: App) => app.spec.project_id === projectId)
}

export async function getAppStatus(appId: string) {
  const response = await fetch(`https://api.digitalocean.com/v2/apps/${appId}`, { headers, cache: 'no-store' })
  const json = await response.json()
  return json.app
}

export async function getAppDeployments(appId: string) {
  const response = await fetch(`https://api.digitalocean.com/v2/apps/${appId}/deployments`, { headers })
  const json = await response.json()
  return json.deployments
}

export async function getDeploymentLogs(appId: string, deploymentId: string) {
  const response = await fetch(`https://api.digitalocean.com/v2/apps/${appId}/deployments/${deploymentId}/logs`, { headers })
  const json = await response.json()
  return json.logs || []
}

export async function getAppAlerts(appId: string) {
  const response = await fetch(`https://api.digitalocean.com/v2/apps/${appId}/alerts`, { headers })
  const json = await response.json()
  return json.alerts || []
}

export async function getAppBandwidth(appId: string) {
  const response = await fetch(`https://api.digitalocean.com/v2/apps/${appId}/metrics/bandwidth/daily`, { headers })
  const json = await response.json()
  return json.data || []
}

export async function getAppHealth(appId: string) {
  const response = await fetch(`https://api.digitalocean.com/v2/apps/${appId}/health`, { headers })
  const json = await response.json()
  return json.health
}