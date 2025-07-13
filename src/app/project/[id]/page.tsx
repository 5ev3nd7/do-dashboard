import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { App, Project, ProjectResource, MonitoringData } from '../../types'
import AppDeploymentList from '@/app/components/AppDeploymentList';
import MonitoringMetrics from '@/app/components/MonitoringMetrics';

const token = process.env.DIGITALOCEAN_API_TOKEN!;

async function fetchProject(projectId: string): Promise<Project | null> {
  const res = await fetch(`https://api.digitalocean.com/v2/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.project;
}

async function fetchProjectResources(projectId: string): Promise<ProjectResource[]> {
  const res = await fetch(`https://api.digitalocean.com/v2/projects/${projectId}/resources`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json();
  return data.resources ?? [];
}

async function fetchApp(appId: string): Promise<App | null> {
  const [appRes, deployRes] = await Promise.all([
    fetch(`https://api.digitalocean.com/v2/apps/${appId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
    fetch(`https://api.digitalocean.com/v2/apps/${appId}/deployments`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),
  ]);

  if (!appRes.ok) return null;

  const appData = await appRes.json();
  const deployData = await deployRes.json();
// console.log(JSON.stringify(appData.app, null, 2));
// console.log(JSON.stringify(deployData.deployments, null, 2));
  return { ...appData.app, deployments: deployData.deployments };
}

function extractAppIdFromUrn(urn: string): string | null {
  const match = urn.match(/^do:app:(.+)$/);
  return match ? match[1] : null;
}

async function fetchAppMonitoring(appId: string): Promise<MonitoringData> {
  const end = Math.floor(Date.now() / 1000);
  const start = end - (24 * 60 * 60); // 24 hours
  
  try {
    const [memoryRes, cpuRes] = await Promise.all([
      fetch(`https://api.digitalocean.com/v2/monitoring/metrics/apps/memory_percentage?app_id=${appId}&start=${start}&end=${end}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`https://api.digitalocean.com/v2/monitoring/metrics/apps/cpu_percentage?app_id=${appId}&start=${start}&end=${end}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ]);

    let memoryData = null;
    let cpuData = null;

    if (memoryRes.ok) {
      const memoryJson = await memoryRes.json();
      // Fix: Access data.result instead of data directly
      if (memoryJson.data && memoryJson.data.result && memoryJson.data.result.length > 0) {
        const resultWithData = memoryJson.data.result.find(r => r.values && r.values.length > 0);
        if (resultWithData) {
          // Get the latest value (last in the values array)
          const latestValue = resultWithData.values[resultWithData.values.length - 1];
          memoryData = parseFloat(latestValue[1]); // [timestamp, value]
        }
      }
    }

    if (cpuRes.ok) {
      const cpuJson = await cpuRes.json();
      // Fix: Access data.result instead of data directly
      if (cpuJson.data && cpuJson.data.result && cpuJson.data.result.length > 0) {
        const resultWithData = cpuJson.data.result.find(r => r.values && r.values.length > 0);
        if (resultWithData) {
          // Get the latest value (last in the values array)
          const latestValue = resultWithData.values[resultWithData.values.length - 1];
          cpuData = parseFloat(latestValue[1]); // [timestamp, value]
        }
      }
    }

    return {
      memory_percentage: memoryData,
      cpu_percentage: cpuData,
      timestamp: end,
    };
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return {
      memory_percentage: null,
      cpu_percentage: null,
      timestamp: end,
    };
  }
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const project = await fetchProject(id);
  if (!project) return notFound();

  const resources = await fetchProjectResources(project.id);
  const appIds = resources.map((r) => extractAppIdFromUrn(r.urn)).filter(Boolean) as string[];
  
  console.log('App IDs found:', appIds); // Add this

  // Update your app fetching logic to properly include monitoring data
  const appsWithMonitoring = await Promise.all(
    appIds.map(async (appId) => {
      const app = await fetchApp(appId);
      if (app) {
        const monitoring = await fetchAppMonitoring(appId);
        console.log(`Monitoring data for app ${appId}:`, monitoring); // Add this
        return { ...app, monitoring } as App;
      }
      return null;
    })
  );
  
  const validApps = appsWithMonitoring.filter(Boolean) as App[];
  console.log('Valid apps with monitoring:', validApps); // Add this



// export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
//   const { id } = params;
//   const project = await fetchProject(id);
//   if (!project) return notFound();

//   const resources = await fetchProjectResources(project.id);
//   const appIds = resources.map((r) => extractAppIdFromUrn(r.urn)).filter(Boolean) as string[];

//   const apps = await Promise.all(appIds.map(fetchApp, fetchAppMonitoring));
//   const validApps = apps.filter(Boolean) as App[];

  return (
    <main className="p-6">
      <Link href="/" className="inline-block mb-4 text-blue-600 hover:underline">
        ← Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-2">Project: {project.name}</h1>
      <p className="text-xs text-gray-500 mb-6">Project ID: {project.id}</p>

      {validApps.map((app) => (
        <div key={app.id}>
          <MonitoringMetrics app={app}/>
          <AppDeploymentList app={app} />
        </div>
      ))}
    </main>
  );
}