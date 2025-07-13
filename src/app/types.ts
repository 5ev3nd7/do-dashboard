export interface Project {
  id: string;
  name: string;
}

export interface ProjectResource {
  urn: string;
}

export interface App {
  id: string;
  spec: {
    name: string;
  };
  live_url?: string;
  active_deployment?: ActiveDeployment;
  deployments?: Deployment[];
  memory_percentage?: number | null;
  cpu_percentage?: number | null;
}

export interface Step {
  name: string;
  status: string;
  started_at?: string;
  ended_at?: string;
}

export interface ProgressStep {
  name: string;
  status: string;
  steps?: Step[];
}

export interface Progress {
  success_steps: number;
  total_steps: number;
  steps: ProgressStep[];
}

export interface Deployment {
  id: string;
  created_at: string;
  updated_at: string;
  phase: string;
  cause_details?: {
    type?: string;
    git_push?: {
      github?: {
        repo: string;
        branch: string;
      };
      username?: string;
      commit_sha?: string;
      commit_message?: string;
    };
    digitalocean_user_action?: {
      name?: string;
      user?: {
        full_name?: string;
        email?: string;
        uuid?: string;
      };
    };
  };
  progress?: Progress;
}

export interface ActiveDeployment {
  id: string;
  created_at: string;
  updated_at: string;
  phase: string;
  cause_details?: {
    type?: string;
    git_push?: {
      github?: {
        repo: string;
        branch: string;
      };
      username?: string;
      commit_sha?: string;
      commit_message?: string;
    };
    digitalocean_user_action?: {
      name?: string;
      user?: {
        full_name?: string;
        email?: string;
        uuid?: string;
      };
    };
  };
  progress?: Progress;
}

export interface MonitoringData {
  memory_percentage: number | null;
  cpu_percentage: number | null;
  timestamp: number;
}

export interface AppWithMonitoring extends App {
  monitoring?: MonitoringData;
}
