/** When auth is disabled, submit API uses these if the client omits submitter fields. */
export function resolveSubmitterFromBody(body: {
  submitterEmail?: unknown;
  submitterName?: unknown;
}): { email: string; name: string | null } {
  const emailRaw =
    typeof body.submitterEmail === "string" ? body.submitterEmail.trim() : "";
  const nameRaw =
    typeof body.submitterName === "string" ? body.submitterName.trim() : "";
  const envEmail = process.env.SUBMITTER_FALLBACK_EMAIL?.trim() ?? "";
  const envName = process.env.SUBMITTER_FALLBACK_NAME?.trim() ?? "";
  const email = emailRaw || envEmail || "anonymous@localhost";
  const name = nameRaw || envName || null;
  return { email, name };
}
