import { invokeAdminEdgeFunction } from "./invoke-admin-edge";

export type DeployRunStatus = "running" | "success" | "failure";

type TriggerResponse = {
  ok?: boolean;
  error?: string;
  detail?: string;
  startedAt?: string;
  runId?: number | null;
  status?: DeployRunStatus;
};

type StatusResponse = {
  ok?: boolean;
  error?: string;
  runId?: number;
  status?: DeployRunStatus;
  runCreatedAt?: string;
  runUpdatedAt?: string;
  completedAt?: string | null;
};

export async function triggerDeploy() {
  return invokeAdminEdgeFunction<TriggerResponse>("trigger-deploy", {});
}

export async function fetchDeployStatus(runId?: number | null) {
  return invokeAdminEdgeFunction<StatusResponse>("deploy-status", {
    ...(runId != null ? { runId } : {}),
  });
}
