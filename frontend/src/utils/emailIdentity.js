/**
 * Returns the local part of an email (before "@"), or the whole string if no "@".
 */
export function emailLocalPart(email) {
  if (!email || typeof email !== "string") return "";
  const at = email.indexOf("@");
  return at === -1 ? email.trim() : email.slice(0, at).trim();
}

/**
 * Formats a stored local id for UI (e.g. "sme" → "Sme"). Use for display only;
 * keep using {@link emailLocalPart} for API payloads and matching.
 */
export function displayLocalId(localPart) {
  if (!localPart || typeof localPart !== "string") return "";
  const t = localPart.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Local part of email, formatted for display. */
export function displayLocalPart(email) {
  return displayLocalId(emailLocalPart(email));
}

/** Email saved on successful login; cleared with tokens on logout. */
export function getSessionEmail() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("email") || "";
}
