/**
 * G-5z-c — Module-level read-only data loading for staging shell UI.
 */

import type {
  DiscographyReadModel,
  LinkReadModel,
  NewsReadModel,
  ProfileReadModel,
  ScheduleReadModel,
} from "./read-only-data-adapter.types";
import type { ReadOnlyDataConfig } from "./read-only-data-config";
import { getReadOnlyDataAdapter } from "./read-only-data-factory";

export type ModuleLoadStatus =
  | "ok"
  | "empty"
  | "error"
  | "rls-denied"
  | "mock-fallback";

export interface ModulePreview<T> {
  module: string;
  status: ModuleLoadStatus;
  message?: string;
  data: T;
}

export interface StagingReadOnlyPreviewBundle {
  adapterProvider: "mock" | "supabase";
  profile: ModulePreview<ProfileReadModel | null>;
  schedules: ModulePreview<ScheduleReadModel[]>;
  discography: ModulePreview<DiscographyReadModel[]>;
  links: ModulePreview<LinkReadModel[]>;
  news: ModulePreview<NewsReadModel[]>;
}

function classifyModuleError(error: unknown): ModuleLoadStatus {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  if (
    message.includes("permission denied") ||
    message.includes("rls") ||
    message.includes("42501") ||
    message.includes("pgrst301")
  ) {
    return "rls-denied";
  }
  return "error";
}

function safeModuleMessage(module: string, status: ModuleLoadStatus): string {
  if (status === "rls-denied") {
    return `${module} could not be loaded (access denied). This module remains in fallback mode. No write operation was attempted.`;
  }
  if (status === "error") {
    return `${module} could not be loaded from staging Supabase. This module remains in fallback mode. No write operation was attempted.`;
  }
  return "";
}

async function loadProfile(
  adapter: ReturnType<typeof getReadOnlyDataAdapter>,
): Promise<ModulePreview<ProfileReadModel | null>> {
  try {
    const data = await adapter.getProfile();
    if (!data) {
      return { module: "profile", status: "empty", data: null };
    }
    return { module: "profile", status: "ok", data };
  } catch (err) {
    const status = classifyModuleError(err);
    return {
      module: "profile",
      status,
      message: safeModuleMessage("Profile", status),
      data: null,
    };
  }
}

async function loadList<T>(
  module: string,
  loader: () => Promise<T[]>,
): Promise<ModulePreview<T[]>> {
  try {
    const data = await loader();
    if (!data.length) {
      return { module, status: "empty", data: [] };
    }
    return { module, status: "ok", data };
  } catch (err) {
    const status = classifyModuleError(err);
    return {
      module,
      status,
      message: safeModuleMessage(module, status),
      data: [],
    };
  }
}

export async function loadStagingReadOnlyPreview(
  config: ReadOnlyDataConfig,
): Promise<StagingReadOnlyPreviewBundle> {
  const useMock =
    !config.supabaseDataEnabled ||
    !config.supabaseConfigured ||
    config.configMissing;

  const adapter = getReadOnlyDataAdapter(
    useMock ? { ...config, supabaseDataEnabled: false } : config,
  );

  const [profile, schedules, discography, links, news] = await Promise.all([
    loadProfile(adapter),
    loadList("schedule", () => adapter.listSchedules()),
    loadList("discography", () => adapter.listDiscography()),
    loadList("links", () => adapter.listLinks()),
    loadList("news", () => adapter.listNews()),
  ]);

  return {
    adapterProvider: adapter.provider,
    profile,
    schedules,
    discography,
    links,
    news,
  };
}
