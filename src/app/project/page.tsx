import React from 'react';

interface Project {
  id: string;
  name: string;
}

interface ProjectResource {
  urn: string;
  type: string;
  name?: string;
  created_at?: string;
  links?: { self: string };
  [key: string]: unknown; // no more 'any'
}

const DIGITALOCEAN_API_TOKEN = process.env.DIGITALOCEAN_API_TOKEN as string;

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch('https://api.digitalocean.com/v2/projects', {
    headers: { Authorization: `Bearer ${DIGITALOCEAN_API_TOKEN}` },
    cache: 'no-store',
  });
  const data = await res.json();
  return data.projects;
}

async function fetchProjectResources(projectId: string): Promise<ProjectResource[]> {
  const res = await fetch(`https://api.digitalocean.com/v2/projects/${projectId}/resources`, {
    headers: { Authorization: `Bearer ${DIGITALOCEAN_API_TOKEN}` },
    cache: 'no-store',
  });
  const data = await res.json();
  return data.resources;
}

export default async function ProjectsDebugPage() {
  const projects = await fetchProjects();

  return (
    <main style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>Project Resources Debug</h1>
      {await Promise.all(
        projects.map(async (project) => {
          const resources = await fetchProjectResources(project.id);

          return (
            <section key={project.id} style={{ marginBottom: 40 }}>
              <h2>{project.name}</h2>
              <p><strong>Project ID:</strong> {project.id}</p>

              {resources.length === 0 ? (
                <p><em>No resources found.</em></p>
              ) : (
                <ul style={{ paddingLeft: 20 }}>
                  {resources.map((res) => (
                    <li key={res.urn}>
                      <pre style={{ background: '#f5f5f5', padding: 10 }}>
                        {JSON.stringify(res, null, 2)}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </main>
  );
}
