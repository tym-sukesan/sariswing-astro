/**
 * G-5z-c — Read-only data adapter factory (mock or Supabase).
 */

import type { ReadOnlyDataAdapter } from "./read-only-data-adapter.types";
import type { ReadOnlyDataConfig } from "./read-only-data-config";
import { createMockReadOnlyDataAdapter } from "./mock-read-only-data-adapter";
import { createSupabaseReadOnlyDataAdapter } from "./supabase-read-only-data-adapter";

export function getReadOnlyDataAdapter(
  config: ReadOnlyDataConfig,
): ReadOnlyDataAdapter {
  if (
    config.supabaseDataEnabled &&
    config.supabaseConfigured &&
    config.supabaseUrl &&
    config.supabaseAnonKey
  ) {
    return createSupabaseReadOnlyDataAdapter(
      config.supabaseUrl,
      config.supabaseAnonKey,
    );
  }
  return createMockReadOnlyDataAdapter();
}
