const DEFAULT_DEV_API_BASE_URL = "http://127.0.0.1:8000/api";

function trimTrailingSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function forceHttpForLocalhost(url) {
  return url.replace(/^https:\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/i, "http://$1");
}

function readConfiguredApiBaseUrl() {
  const runtimeBaseUrl = globalThis.__CODEQUEST_API_BASE_URL__;
  if (runtimeBaseUrl) return runtimeBaseUrl;

  return import.meta.env.VITE_API_BASE_URL || DEFAULT_DEV_API_BASE_URL;
}

export function resolveApiBaseUrl() {
  const configuredUrl = trimTrailingSlash(readConfiguredApiBaseUrl());
  // Local Django dev server only speaks HTTP. Production URLs are preserved as configured.
  return forceHttpForLocalhost(configuredUrl || DEFAULT_DEV_API_BASE_URL);
}

export const API_BASE_URL = resolveApiBaseUrl();
