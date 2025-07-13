import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { App, Project, ProjectResource, MonitoringData, MonitoringResult } from '../../types'
import AppDeploymentList from '@/app/components/AppDeploymentList';
import MonitoringMetrics from '@/app/components/MonitoringMetrics';
import MetricsInsights from '@/app/components/MetricsInsights';

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
      if (memoryJson.data && memoryJson.data.result && memoryJson.data.result.length > 0) {
        const results = memoryJson.data.result as MonitoringResult[];
        const resultWithData = results.find((r) => r.values && r.values.length > 0);
        if (resultWithData) {
          const latestValue = resultWithData.values[resultWithData.values.length - 1];
          memoryData = parseFloat(latestValue[1]); // [timestamp, value]
        }
      }
    }

    if (cpuRes.ok) {
      const cpuJson = await cpuRes.json();
      if (cpuJson.data && cpuJson.data.result && cpuJson.data.result.length > 0) {
        const results = cpuJson.data.result as MonitoringResult[];
        const resultWithData = results.find((r) => r.values && r.values.length > 0);
        if (resultWithData) {
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
  
  // console.log('App IDs found:', appIds);

  const appsWithMonitoring = await Promise.all(
    appIds.map(async (appId) => {
      const app = await fetchApp(appId);
      if (app) {
        const monitoring = await fetchAppMonitoring(appId);
        // console.log(`Monitoring data for app ${appId}:`, monitoring);
        return { ...app, monitoring } as App;
      }
      return null;
    })
  );
  
  const validApps = appsWithMonitoring.filter(Boolean) as App[];
  // console.log('Valid apps with monitoring:', validApps);

  return (
    <main className="p-6">
      <Link href="/" className="inline-block mb-4 text-blue-600 hover:underline">
        ← Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-2">Project: {project.name}</h1>
      <p className="text-xs text-gray-500 mb-6">Project ID: {project.id}</p>

      {validApps.map((app) => (
        <div key={app.id} className="border-t-2 border-black pt-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <AppDeploymentList app={app} />
            </div>
            <div className="flex flex-col gap-6">
              <MonitoringMetrics app={app}/>
              <MetricsInsights app={app}/>
            </div>
          </div>
        </div>
      ))}
    </main>
  );
}