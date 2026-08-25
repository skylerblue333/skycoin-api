# SkyAPIControlPlane — Wave 2 slot #168

SkyAPIControlPlane is an engineering-beta metadata catalog for API products, versions, capabilities, and their route contracts. It builds on the existing `ApiRouteCatalog` and refuses capability references to route keys that are not registered there.

## SKYCOIN4444 integration

A product/version record uses schema `sky.api-control-plane.product.v1`. Each capability has a stable `capabilityId`, bounded summary, and zero or more route keys in the existing route-catalog format: `<version>:<METHOD>:<path>`. Integration tests register actual route metadata first, then verify that control-plane capabilities can reference those routes and reject unknown ones.

## Security and product boundaries

Identifiers, versions, summaries, route references, capability counts, and duplicate registrations are validated. The catalog is deterministic and in-memory.

This is not an API gateway, network control plane, service discovery system, authorization server, rate limiter, deployment manager, billing system, or proof that listed APIs are live. It does not make network calls, execute handlers, deploy services, probe endpoints, or independently verify operational availability. Authentication, authorization, routing, lifecycle ownership, observability, and production deployment remain external responsibilities.

## Verification

The existing repository CI runs Node 22, builds TypeScript, executes the Node test suite, and performs a high-severity production-dependency audit. Tests cover integration with existing route metadata, unknown-route rejection, duplicate capability/version handling, and deterministic catalog ordering.
