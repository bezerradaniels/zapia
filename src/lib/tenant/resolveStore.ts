export const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN ?? "zapia.app";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "staging",
  "admin",
  "site",
  "gestao",
  "api",
  "mail",
]);

const RESERVED_PATHS = new Set([
  "",
  "precos",
  "entrar",
  "cadastrar",
  "recuperar-senha",
  "nova-loja",
  "dashboard",
  "admin",
]);

export function isAdminDomain(): boolean {
  const { hostname } = window.location;
  if (hostname === "admin.localhost") return true;
  return hostname === `admin.${ROOT_DOMAIN}`;
}

export function isGestaoDomain(): boolean {
  const { hostname } = window.location;
  if (hostname === "gestao.localhost" || hostname === "app.localhost") return true;
  return hostname === `gestao.${ROOT_DOMAIN}` || hostname === `app.${ROOT_DOMAIN}`;
}

export function isSiteDomain(): boolean {
  const { hostname } = window.location;
  if (hostname === "site.localhost") return true;
  return hostname === `site.${ROOT_DOMAIN}` || hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`;
}

export function isStoreDomain(): boolean {
  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return false;
  if (isAdminDomain() || isGestaoDomain() || isSiteDomain()) return false;
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.slice(0, hostname.length - ".localhost".length);
    return !!sub && !RESERVED_SUBDOMAINS.has(sub);
  }
  if (!hostname.endsWith(`.${ROOT_DOMAIN}`)) return false;
  const sub = hostname.slice(0, hostname.length - ROOT_DOMAIN.length - 1);
  return !!sub && !RESERVED_SUBDOMAINS.has(sub);
}

export function resolveStoreSlug(): string | null {
  if (isStoreDomain()) {
    const { hostname } = window.location;
    if (hostname.endsWith(".localhost")) {
      const sub = hostname.slice(0, hostname.length - ".localhost".length);
      return sub || null;
    }
    const sub = hostname.slice(0, hostname.length - ROOT_DOMAIN.length - 1);
    return sub || null;
  }

  const pathSlug = window.location.pathname.split("/").filter(Boolean)[0] ?? "";
  if (pathSlug && !RESERVED_PATHS.has(pathSlug)) return pathSlug;
  return null;
}

export function buildStoreUrl(slug: string): string {
  const { protocol, hostname, port } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const host = `${hostname}${port ? `:${port}` : ""}`;
    return `${protocol}//${host}${buildStorePath(slug)}`;
  }
  return `${protocol}//${slug}.${ROOT_DOMAIN}`;
}

export function buildStorePath(slug: string, path = ""): string {
  const cleanPath = path.replace(/^\/+/, "");
  if (isStoreDomain()) {
    return `/${cleanPath}`;
  }
  return `/${slug}${cleanPath ? `/${cleanPath}` : ""}`;
}
