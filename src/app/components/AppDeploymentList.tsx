"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import type { App, Deployment } from '../types'
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function buildDuration(deployment: Deployment) {
  const buildStep = deployment?.progress?.steps?.find(
    (step) => step.name === "build"
  );
  
  // Get the timing for the entire build step, not just initialize
  if (!buildStep?.steps || buildStep.steps.length === 0) {
    return "No timing data";
  }
  
  // Find the earliest start time and latest end time across all sub-steps
  const subSteps = buildStep.steps;
  const startTimes = subSteps
    .map(step => step.started_at)
    .filter(time => time)
    .map(time => new Date(time!));
  
  const endTimes = subSteps
    .map(step => step.ended_at)
    .filter(time => time)
    .map(time => new Date(time!));
  
  if (startTimes.length === 0 || endTimes.length === 0) {
    return "No timing data";
  }
  
  // Get the earliest start and latest end
  const start = new Date(Math.min(...startTimes.map(d => d.getTime())));
  const end = new Date(Math.max(...endTimes.map(d => d.getTime())));
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "Invalid dates";
  }
  
  const durationMs = end.getTime() - start.getTime();
  
  // Format the duration nicely
  if (durationMs < 1000) {
    return `${durationMs}ms build`;
  } else if (durationMs < 60000) {
    return `${(durationMs/1000).toFixed(1)}s build`;
  } else {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s build`;
  }
}

export default function AppDeploymentList({ app }: { app: App }) {
  const [visibleCount, setVisibleCount] = useState(5);

  const deployments = (app.deployments || []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-2">{app.spec.name}</h2>

      {app.live_url && (
        <p className="text-sm text-blue-600 mb-6">
          <a href={app.live_url} target="_blank" rel="noopener noreferrer">
            {app.live_url}
          </a>
        </p>
      )}

      <ul className="relative ml-4 pl-7.5 border-l border-gray-300">
        {deployments.slice(0, visibleCount).map((d) => {
          const isLive = d.id === app.active_deployment?.id;
          const status = d.phase;

          let icon = <CheckCircleIcon className="w-5 h-5 text-green-500" />;
          if (isLive) icon = <Badge variant="secondary"className="bg-green-500 text-white dark:bg-blue-600">LIVE</Badge>
          if (status === "ERROR") icon = <XCircleIcon className="w-5 h-5 text-red-500" />;
          if (status === "CANCELED") icon = <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;

          const statusText = status === "ERROR"
            ? "deployment failed"
            : status === "CANCELED"
            ? "deployment was canceled"
            : isLive
            ? "deployment is currently live"
            : "deployment was successful";

          const git = d.cause_details?.git_push;
          const manual = d.cause_details?.digitalocean_user_action;

          const deployer =
            git?.username ||
            manual?.user?.full_name ||
            app.spec.name;

          const triggerType = d.cause_details?.type || "App Platform";
          const manualAction = manual?.name;
          const trigger = manualAction ? `${triggerType} (${manualAction})` : triggerType;

          const commit = git?.commit_sha?.slice(0, 7);
          const repo = git?.github?.repo;
          const branch = git?.github?.branch;

          return (
            <li key={d.id} className="relative mb-8 pl-2 space-y-2">
              <div className={clsx(
                "absolute h-13 w-8 bg-white -top-4",
                isLive ? "-left-12" : "-left-10"
              )}>
                <div className="absolute top-4">
                  {icon}
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-800">
                {deployer}’s {statusText}
              </div>
              <div className="text-sm text-gray-600">
                <div className="">• Trigger: {trigger}{' '}</div>
                {commit && repo && branch ? (
                  <ul className="relative pl-4 py-2 border-l border-gray-300">
                    <li>
                      <a
                        href={`https://github.com/${repo}/commit/${git?.commit_sha}`}
                        className="text-blue-600 font-mono"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {commit}
                      </a>{' '}
                      to <span className="font-medium">{repo}/{branch}</span>
                    </li>
                    <li>
                      {git?.commit_message && (
                        <div className="text-sm text-gray-600">
                          Commit message: {git.commit_message}
                        </div>
                      )}
                    </li>
                  </ul>
                ) : null}
              </div>

              <div className="text-sm text-gray-600 font-[courier] tracking-tighter">
                {formatDate(d.created_at)} • {formatTime(d.created_at)} • {buildDuration(d)} • Rollback Unavailable
              </div>
            </li>
          );
        })}
      </ul>

      {deployments.length > visibleCount && (
        <div className="mt-4">
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setVisibleCount(visibleCount + 5)}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
