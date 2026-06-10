/**
 * G-5z-b — Mock read-only data adapter. No Supabase / fetch / DB.
 */

import type { ReadOnlyDataAdapter } from "./read-only-data-adapter.types";
import {
  MOCK_DISCOGRAPHY,
  MOCK_LINKS,
  MOCK_NEWS,
  MOCK_PROFILE,
  MOCK_SCHEDULES,
} from "./mock-read-only-data.fixtures";

export function createMockReadOnlyDataAdapter(): ReadOnlyDataAdapter {
  return {
    provider: "mock",
    connectedToRuntime: false,
    productionReady: false,
    canWrite: false,
    async getProfile() {
      return { ...MOCK_PROFILE };
    },
    async listSchedules() {
      return MOCK_SCHEDULES.map((row) => ({ ...row }));
    },
    async listDiscography() {
      return MOCK_DISCOGRAPHY.map((row) => ({ ...row }));
    },
    async listLinks() {
      return MOCK_LINKS.map((row) => ({ ...row }));
    },
    async listNews() {
      return MOCK_NEWS.map((row) => ({ ...row }));
    },
  };
}
