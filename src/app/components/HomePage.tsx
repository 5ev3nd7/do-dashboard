"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { ProjectSummary } from "../types"
import { LoadingDialog } from "@/app/components/LoadingDialog"

export default function Home({ projects }: { projects: ProjectSummary[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleProjectClick = (id: string) => {
    if (loading) return // block double press
    setLoading(true)
    router.push(`/project/${id}`)
  }

  return (
    <main className="p-6 space-y-8">
      <LoadingDialog open={loading} />

      <h1 className="text-3xl font-bold">DigitalOcean Dashboard</h1>
      <p className="text-muted-foreground">Overview of all projects and apps</p>

      {projects.map((project: ProjectSummary) => (
        <div
          key={project.id}
          className="border border-gray-200 rounded-xl hover:border-blue-500 cursor-pointer"
          onClick={() => handleProjectClick(project.id)}
        >
          <div className="flex justify-between items-center mb-4 p-4">
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <span className="text-blue-600 underline">View Details</span>
          </div>
        </div>
      ))}
    </main>
  )
}