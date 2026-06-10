/**
 * Admin session checker scaffold (G-5y-b).
 */

import type { AdminSession } from "./auth-adapter.types.js";

export function isAuthenticated(session: AdminSession): boolean {
  return (
    session.status === "signed-in" ||
    session.status === "admin" ||
    session.status === "mock"
  );
}

export function isRuntimeConnected(session: AdminSession): boolean {
  return session.connectedToRuntime === true;
}

export function isProductionReady(session: AdminSession): boolean {
  return session.productionReady === true;
}

export function isMockSession(session: AdminSession): boolean {
  return session.status === "mock" || session.provider === "mock";
}

/**
 * Ensures session is scaffold-only (G-5y-b). Throws if runtime-connected.
 */
export function assertScaffoldOnly(session: AdminSession): void {
  if (session.connectedToRuntime) {
    throw new Error("Admin session must remain scaffold-only (connectedToRuntime: false)");
  }
  if (session.productionReady) {
    throw new Error("Admin session must remain non-production (productionReady: false)");
  }
}
