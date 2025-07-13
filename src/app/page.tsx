import Link from 'next/link'
import { listProjects, getProjectApps, getAppHealth, getAppDeployments } from './actions'
import type { App, Project, AppSummary, ProjectSummary } from './types'

export default async function Home() {
  const projects: Project[] = await listProjects()

  const projectData: ProjectSummary[] = await Promise.all(
    projects.map(async (project: Project) => {
      const apps: App[] = await getProjectApps(project.id)

      const summaries: AppSummary[] = await Promise.all(
        apps.map(async (app: App): Promise<AppSummary> => {
          const [health, deployments] = await Promise.all([
            getAppHealth(app.id),
            getAppDeployments(app.id),
          ])
          return {
            id: app.id,
            name: app.spec.name,
            health,
            latestDeploy: deployments?.[0]?.created_at,
          }
        })
      )

      const mostRecent = summaries.sort((a, b) => {
        return new Date(b.latestDeploy || 0).getTime() - new Date(a.latestDeploy || 0).getTime()
      })

      return {
        id: project.id,
        name: project.name,
        apps: mostRecent,
      }
    })
  )

  return (
    <main className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">DigitalOcean Dashboard</h1>
      <p className="text-muted-foreground">Overview of all projects and apps</p>

      {projectData.map((project: ProjectSummary) => (
        <div key={project.id} className="border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <Link className="text-blue-600 underline" href={`/project/${project.id}`}>
              View Details
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.apps.map((app: AppSummary) => (
              <div key={app.id} className="border border-gray-100 rounded-lg p-4 shadow-sm bg-white">
                <h3 className="font-semibold text-sm mb-1">{app.name}</h3>
                <p className="text-xs text-muted-foreground mb-1">
                  Latest deploy: {app.latestDeploy ? new Date(app.latestDeploy).toLocaleString() : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Health: <span className={`font-medium ${app.health.status === 'healthy' ? 'text-green-600' : 'text-red-500'}`}>{app.health.status}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  )
}