import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiRouteCatalog } from '../src/index';

test('normalizes paths and returns deterministic route metadata', () => {
  const catalog = new ApiRouteCatalog();
  const route = catalog.register({ method: 'GET', path: '/v1//health/', version: 'v1', summary: 'Health', authRequired: false });
  assert.equal(route.path, '/v1/health');
  assert.equal(route.key, 'v1:GET:/v1/health');
  assert.deepEqual(catalog.get('v1', 'GET', '/v1/health'), route);
});

test('identical normalized registrations are idempotent while conflicting metadata fails', () => {
  const catalog = new ApiRouteCatalog();
  const descriptor = { method: 'POST' as const, path: '/v1/items/', version: 'v1', summary: 'Create item', authRequired: true };
  const first = catalog.register(descriptor);
  const reordered = {
    authRequired: true,
    summary: 'Create item',
    version: 'v1',
    path: '/v1//items',
    method: 'POST' as const,
  };
  assert.equal(first.key, catalog.register(reordered).key);
  assert.throws(
    () => catalog.register({ ...descriptor, summary: 'Different meaning' }),
    /route conflict/,
  );
  assert.equal(catalog.size, 1);
});

test('list ordering is locale-independent and version filtering is exact', () => {
  const catalog = new ApiRouteCatalog();
  catalog.register({ method: 'GET', path: '/z', version: 'v1', summary: 'Z', authRequired: false });
  catalog.register({ method: 'GET', path: '/ä', version: 'v1', summary: 'A umlaut', authRequired: false });
  catalog.register({ method: 'GET', path: '/only-v2', version: 'v2', summary: 'V2', authRequired: false });
  assert.deepEqual(catalog.list('v1').map((route) => route.path), ['/z', '/ä']);
});

test('rejects malformed route descriptions including runtime boolean violations', () => {
  const catalog = new ApiRouteCatalog();
  assert.throws(
    () => catalog.register({ method: 'GET', path: 'v1/no-slash', version: 'v1', summary: 'Bad', authRequired: false }),
    /start with/,
  );
  assert.throws(
    () => catalog.register({ method: 'GET', path: '/x?query=1', version: 'v1', summary: 'Bad', authRequired: false }),
    /query strings/,
  );
  assert.throws(
    () => catalog.register({ method: 'GET', path: '/x', version: 'bad version', summary: 'Bad', authRequired: false }),
    /version/,
  );
  assert.throws(
    () => catalog.register({ method: 'GET', path: '/x', version: 'v1', summary: 'Bad auth', authRequired: 'false' as unknown as boolean }),
    /authRequired must be boolean/,
  );
});

test('returned records do not mutate catalog state', () => {
  const catalog = new ApiRouteCatalog();
  const route = catalog.register({ method: 'GET', path: '/x', version: 'v1', summary: 'Original', authRequired: false });
  route.summary = 'Mutated';
  assert.equal(catalog.get('v1', 'GET', '/x')?.summary, 'Original');
});
