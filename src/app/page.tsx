import { listProjects } from './actions'
import type { Project, ProjectSummary } from './types'
import HomePage from './components/HomePage'

export default async function Page() {
  const projects: Project[] = await listProjects()

  const projectData: ProjectSummary[] = projects.map((project: Project) => ({
    id: project.id,
    name: project.name,
  }))

  return <HomePage projects={projectData} />
}
