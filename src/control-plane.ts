import type { HttpMethod } from './index.js';
import { ApiRouteCatalog } from './index.js';

export interface ApiCapability {
  readonly capabilityId: string;
  readonly summary: string;
  readonly routeKeys: readonly string[];
}

export interface ApiProductDescriptor {
  readonly productId: string;
  readonly version: string;
  readonly capabilities: readonly ApiCapability[];
}

export interface ApiProductRecord extends ApiProductDescriptor {
  readonly schema: 'sky.api-control-plane.product.v1';
}

const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}$/;
const VERSION = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

function requireId(value: string, name: string): string {
  if (typeof value !== 'string' || !ID.test(value)) throw new Error(`${name} is invalid`);
  return value;
}

function requireVersion(value: string): string {
  if (typeof value !== 'string' || !VERSION.test(value)) throw new Error('version is invalid');
  return value;
}

function routeKey(version: string, method: HttpMethod, path: string): string {
  return `${version}:${method}:${path}`;
}

export class ApiControlPlaneCatalog {
  private readonly products = new Map<string, ApiProductRecord>();

  constructor(private readonly routes: ApiRouteCatalog) {}

  register(descriptor: ApiProductDescriptor): ApiProductRecord {
    const productId = requireId(descriptor.productId, 'productId');
    const version = requireVersion(descriptor.version);
    if (!Array.isArray(descriptor.capabilities) || descriptor.capabilities.length < 1 || descriptor.capabilities.length > 100) {
      throw new Error('capabilities must contain 1-100 items');
    }
    const seen = new Set<string>();
    const capabilities = descriptor.capabilities.map((capability) => {
      const capabilityId = requireId(capability.capabilityId, 'capabilityId');
      if (seen.has(capabilityId)) throw new Error(`duplicate capabilityId: ${capabilityId}`);
      seen.add(capabilityId);
      const summary = capability.summary?.trim();
      if (!summary || summary.length > 512) throw new Error('capability summary is invalid');
      if (!Array.isArray(capability.routeKeys) || capability.routeKeys.length > 100) throw new Error('routeKeys are invalid');
      for (const key of capability.routeKeys) {
        if (typeof key !== 'string' || key.length > 700) throw new Error('route key is invalid');
        const matched = this.routes.list().some((route) => routeKey(route.version, route.method, route.path) === key);
        if (!matched) throw new Error(`unknown route key: ${key}`);
      }
      return Object.freeze({ capabilityId, summary, routeKeys: Object.freeze([...capability.routeKeys]) });
    });
    const key = `${productId}:${version}`;
    if (this.products.has(key)) throw new Error(`product version already exists: ${key}`);
    const record = Object.freeze({
      schema: 'sky.api-control-plane.product.v1' as const,
      productId,
      version,
      capabilities: Object.freeze(capabilities),
    });
    this.products.set(key, record);
    return record;
  }

  get(productIdInput: string, versionInput: string): ApiProductRecord | null {
    const productId = requireId(productIdInput, 'productId');
    const version = requireVersion(versionInput);
    return this.products.get(`${productId}:${version}`) ?? null;
  }

  list(): readonly ApiProductRecord[] {
    return Object.freeze([...this.products.values()].sort((a, b) => `${a.productId}:${a.version}`.localeCompare(`${b.productId}:${b.version}`)));
  }
}
