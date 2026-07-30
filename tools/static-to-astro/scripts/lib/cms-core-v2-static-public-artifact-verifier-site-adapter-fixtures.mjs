/**
 * Fixtures for static-public-artifact-verifier ↔ Gosaki admin public-env decoupling.
 * Synthetic JWTs only — no network / no real secrets.
 */

function b64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj), "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/** Valid-shaped anon JWT (role=anon). Signature not verified by Core. */
export const FIXTURE_ANON_JWT = `eyJhbGciOiJub25lIn0.${b64urlJson({
  role: "anon",
  ref: "fixture-staging",
})}.sig`;

/** Rejected: service_role */
export const FIXTURE_SERVICE_ROLE_JWT = `eyJhbGciOiJub25lIn0.${b64urlJson({
  role: "service_role",
  ref: "fixture-staging",
})}.sig`;

/** Rejected: missing role */
export const FIXTURE_ROLELESS_JWT = `eyJhbGciOiJub25lIn0.${b64urlJson({
  ref: "fixture-staging",
})}.sig`;
