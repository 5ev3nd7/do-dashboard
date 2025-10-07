"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import type { App, Deployment } from "../types";
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

  if (!buildStep?.steps || buildStep.steps.length === 0) {
    return "No timing data";
  }

  const subSteps = buildStep.steps;
  const startTimes = subSteps
    .map((step) => step.started_at)
    .filter(Boolean)
    .map((time) => new Date(time!));
  const endTimes = subSteps
    .map((step) => step.ended_at)
    .filter(Boolean)
    .map((time) => new Date(time!));

  if (startTimes.length === 0 || endTimes.length === 0) {
    return "No timing data";
  }

  const start = new Date(Math.min(...startTimes.map((d) => d.getTime())));
  const end = new Date(Math.max(...endTimes.map((d) => d.getTime())));
  const durationMs = end.getTime() - start.getTime();

  if (isNaN(durationMs)) return "Invalid dates";

  if (durationMs < 1000) return `${durationMs}ms build`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s build`;

  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s build`;
}

export default function AppDeploymentList({ app }: { app: App }) {
  const [visibleCount, setVisibleCount] = useState(5);
  const [logs, setLogs] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullLogUrl, setFullLogUrl] = useState<string | null>(null);

  const deployments = (app.deployments || []).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

async function fetchLogs(
  appId: string,
  deploymentId: string,
  componentName: string,
  status: string
) {
  setLoading(true);
  setLogs(null);
  setFullLogUrl(null);

  try {
    const type = status === "active" || status === "running" ? "RUN" : "BUILD";

    const res = await fetch(
      `/api/logs?appId=${appId}&deploymentId=${deploymentId}&componentName=${componentName}&type=${type}`
    );
    const data = await res.json();

    if (data.error) {
      setLogs(`Error: ${data.error}`);
    } else {
      // Safely extract first historic URL if present
      const firstHistoricUrl =
        data.historic_urls && typeof data.historic_urls === "object"
          ? Object.values(data.historic_urls)[0]
          : null;

      const liveUrl = data.live_url || null;
      const url = type === "RUN" ? liveUrl : firstHistoricUrl;

      if (!url) {
        setLogs("No logs available");
        return;
      }

      // Preview: show placeholder text until you fetch log content
      setLogs(`Previewing logs from: ${url}`);
      setFullLogUrl(url);
    }
  } catch (err) {
    setLogs(`Error: ${err}`);
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-2">App: {app.spec.name}</h2>

      {app.live_url && (
        <p className="text-sm text-blue-600 mb-6">
          <a
            href={app.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1"
          >
            {app.live_url}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </p>
      )}

      <ul className="relative ml-4 pl-7.5 border-l border-gray-300">
        {deployments.slice(0, visibleCount).map((d) => {
          const isLive = d.id === app.active_deployment?.id;
          const status = d.phase;

          let icon = <CheckCircleIcon className="w-5 h-5 text-green-500" />;
          if (isLive)
            icon = (
              <Badge
                variant="secondary"
                className="bg-green-500 text-white dark:bg-blue-600"
              >
                LIVE
              </Badge>
            );
          if (status === "ERROR")
            icon = <XCircleIcon className="w-5 h-5 text-red-500" />;
          if (status === "CANCELED")
            icon = <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;

          const statusText =
            status === "ERROR"
              ? "deployment failed"
              : status === "CANCELED"
              ? "deployment was canceled"
              : isLive
              ? "deployment is currently live"
              : "deployment was successful";

          const git = d.cause_details?.git_push;
          const manual = d.cause_details?.digitalocean_user_action;

          const deployer =
            git?.username || manual?.user?.full_name || app.spec.name;

          const triggerType = d.cause_details?.type || "App Platform";
          const manualAction = manual?.name;
          const trigger = manualAction
            ? `${triggerType} (${manualAction})`
            : triggerType;

          const commit = git?.commit_sha?.slice(0, 7);
          const repo = git?.github?.repo;
          const branch = git?.github?.branch;

          return (
            <li key={d.id} className="relative mb-8 pl-2 space-y-2">
              <div
                className={clsx(
                  "absolute h-13 w-8 bg-white -top-4",
                  isLive ? "-left-12" : "-left-10"
                )}
              >
                <div className="absolute top-4">{icon}</div>
              </div>
              <div className="text-sm font-semibold text-gray-800">
                {deployer}’s {statusText}
              </div>
              <div className="text-sm text-gray-600">
                <div>• Trigger: {trigger} </div>
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
                      </a>{" "}
                      to{" "}
                      <span className="font-medium">
                        {repo}/{branch}
                      </span>
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
                {formatDate(d.created_at)} • {formatTime(d.created_at)} •{" "}
                {buildDuration(d)} • Rollback Unavailable
              </div>

              <div className="text-sm text-gray-600 font-[courier] tracking-tighter">
                {d.spec?.envs?.map((s) => 
                  <div key={d.id}>
                    Env key: {s.key} <br/>
                    Env value: {s.value}
                  </div>
                )}
              </div>

              {(d.spec?.services?.length
                ? d.spec.services.map((s) => s.name)
                : [d.spec?.name] // fallback to deployment name
              ).map((serviceName) =>
                serviceName ? (
                  <Dialog key={serviceName}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetchLogs(
                            app.id,
                            d.id,
                            serviceName,
                            d.phase?.toLowerCase() === "active"
                              ? "RUN"
                              : "BUILD"
                          )
                        }
                      >
                        View Logs
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="min-w-[80vw] min-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>
                          Build log for: {serviceName}
                          <span className="font-normal text-base"> ({formatDate(d.created_at)} • {formatTime(d.created_at)})</span>
                        </DialogTitle>
                      </DialogHeader>
                      {loading && <div className="flex justify-center font-bold">Loading...</div>}
                      {!loading && logs && (
                        <>
                        {fullLogUrl ? (
                          <a
                            href={fullLogUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-base underline"
                          >
                            View full log in new window →
                          </a>
                        ) : (
                          <div className="flex justify-center text-xl">No log file available</div>
                        )}
                        </>
                      )}
                      
                      {!loading && logs && (                          
                        <>
                          {fullLogUrl && (
                            <iframe src={fullLogUrl} className="w-full h-100 min-h-[70vh]"/>
                          )}
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                ) : null
              )}
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
