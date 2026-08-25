export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface RouteDescriptor {
  method: HttpMethod;
  path: string;
  version: string;
  summary: string;
  authRequired: boolean;
}

export interface RouteRecord extends RouteDescriptor {
  key: string;
}

const MAX_ROUTES = 2_000;
const MAX_PATH = 512;
const MAX_SUMMARY = 512;
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const HTTP_METHODS: readonly HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) throw new TypeError('path must start with /');
  if (trimmed.length > MAX_PATH) throw new TypeError(`path cannot exceed ${MAX_PATH} characters`);
  if (trimmed.includes('?') || trimmed.includes('#')) throw new TypeError('path must not contain query strings or fragments');
  const normalized = trimmed.replace(/\/{2,}/g, '/');
  return normalized.length > 1 && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

function validateDescriptor(descriptor: RouteDescriptor): RouteRecord {
  const path = normalizePath(descriptor.path);
  const version = descriptor.version.trim();
  const summary = descriptor.summary.trim();
  if (!VERSION_PATTERN.test(version)) throw new TypeError('version must be 1-64 URL-safe identifier characters');
  if (!summary || summary.length > MAX_SUMMARY) throw new TypeError(`summary must be 1-${MAX_SUMMARY} characters`);
  const method = descriptor.method.toUpperCase() as HttpMethod;
  if (!HTTP_METHODS.includes(method)) throw new TypeError('unsupported HTTP method');
  if (typeof descriptor.authRequired !== 'boolean') throw new TypeError('authRequired must be boolean');
  return { method, path, version, summary, authRequired: descriptor.authRequired, key: `${version}:${method}:${path}` };
}

function sameRouteMetadata(left: RouteRecord, right: RouteRecord): boolean {
  return left.method === right.method
    && left.path === right.path
    && left.version === right.version
    && left.summary === right.summary
    && left.authRequired === right.authRequired;
}

/** Metadata-only catalog. It does not create an HTTP listener or execute handlers. */
export class ApiRouteCatalog {
  private readonly routes = new Map<string, RouteRecord>();

  register(descriptor: RouteDescriptor): RouteRecord {
    const route = validateDescriptor(descriptor);
    const existing = this.routes.get(route.key);
    if (existing) {
      if (sameRouteMetadata(existing, route)) return { ...existing };
      throw new Error(`route conflict for ${route.key}`);
    }
    if (this.routes.size >= MAX_ROUTES) throw new RangeError('route catalog capacity reached');
    this.routes.set(route.key, route);
    return { ...route };
  }

  get(version: string, method: HttpMethod, path: string): RouteRecord | undefined {
    const key = `${version.trim()}:${method.toUpperCase()}:${normalizePath(path)}`;
    const route = this.routes.get(key);
    return route ? { ...route } : undefined;
  }

  list(version?: string): RouteRecord[] {
    const targetVersion = version?.trim();
    return [...this.routes.values()]
      .filter((route) => !targetVersion || route.version === targetVersion)
      .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
      .map((route) => ({ ...route }));
  }

  remove(version: string, method: HttpMethod, path: string): boolean {
    return this.routes.delete(`${version.trim()}:${method.toUpperCase()}:${normalizePath(path)}`);
  }

  get size(): number {
    return this.routes.size;
  }
}

export const LIMITS = { MAX_ROUTES, MAX_PATH, MAX_SUMMARY } as const;
