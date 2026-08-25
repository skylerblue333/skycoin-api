# Sky API Route Catalog

Sky API Route Catalog is a small dependency-free TypeScript library for registering and validating **HTTP route metadata**. It is a catalog/control-plane primitive, not an HTTP server.

## Status

**Engineering beta.** The catalog validates method, normalized path, version, summary, and authentication-required metadata; rejects conflicting registrations; bounds the registry to 2,000 routes; and returns deterministic lists.

The historical repository did not contain an API implementation under `src`; it contained copied AI/security scaffolding and placeholder build/test scripts. Those unrelated surfaces are removed from the active product branch.

## Supported behavior

- HTTP methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD;
- normalized absolute paths with duplicate/trailing slash cleanup;
- explicit version identifiers;
- bounded human-readable summaries;
- `authRequired` metadata;
- idempotent identical registrations;
- conflict detection for the same version/method/path key;
- exact version filtering and deterministic code-unit ordering;
- defensive copies of registered route records.

## Example

```ts
import { ApiRouteCatalog } from './src';

const catalog = new ApiRouteCatalog();
catalog.register({
  method: 'GET',
  path: '/v1/health',
  version: 'v1',
  summary: 'Service health',
  authRequired: false,
});
```

## Verify

```bash
npm install
npm run build
npm test
npm audit --omit=dev --audit-level=high
```

## Boundaries

This library does not create sockets, execute handlers, proxy traffic, authenticate callers, validate request/response schemas, generate OpenAPI documents, persist route metadata, enforce rate limits, provide service discovery, or claim a deployed SKYCOIN4444 API. A real service may consume this catalog as metadata or documentation input.

## SKYCOIN4444 integration

Gateway and service repositories can register their supported route descriptors through a common deterministic catalog without pretending that route metadata itself is a running API platform.

## License

See `LICENSE`.
