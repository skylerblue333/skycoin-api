import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiControlPlaneCatalog, ApiRouteCatalog } from '../src/index.js';

test('registers API product capabilities against existing route metadata', () => {
  const routes = new ApiRouteCatalog();
  routes.register({ method: 'GET', path: '/v1/status', version: 'v1', summary: 'Status metadata', authRequired: false });
  routes.register({ method: 'POST', path: '/v1/forms', version: 'v1', summary: 'Validate form input', authRequired: true });
  const control = new ApiControlPlaneCatalog(routes);
  const product = control.register({
    productId: 'sky-platform', version: 'v1', capabilities: [
      { capabilityId: 'status.read', summary: 'Read service status', routeKeys: ['v1:GET:/v1/status'] },
      { capabilityId: 'forms.validate', summary: 'Validate forms', routeKeys: ['v1:POST:/v1/forms'] },
    ],
  });
  assert.equal(product.schema, 'sky.api-control-plane.product.v1');
  assert.equal(control.get('sky-platform', 'v1')?.capabilities.length, 2);
});

test('rejects unknown route contracts and duplicate capabilities', () => {
  const routes = new ApiRouteCatalog();
  const control = new ApiControlPlaneCatalog(routes);
  assert.throws(() => control.register({
    productId: 'p1', version: 'v1', capabilities: [{ capabilityId: 'missing', summary: 'Missing', routeKeys: ['v1:GET:/missing'] }]
  }), /unknown route key/);

  routes.register({ method: 'GET', path: '/ok', version: 'v1', summary: 'ok', authRequired: false });
  assert.throws(() => control.register({
    productId: 'p1', version: 'v1', capabilities: [
      { capabilityId: 'same', summary: 'one', routeKeys: ['v1:GET:/ok'] },
      { capabilityId: 'same', summary: 'two', routeKeys: ['v1:GET:/ok'] },
    ]
  }), /duplicate capabilityId/);
});

test('lists products deterministically and rejects duplicate product versions', () => {
  const routes = new ApiRouteCatalog();
  routes.register({ method: 'GET', path: '/ok', version: 'v1', summary: 'ok', authRequired: false });
  const control = new ApiControlPlaneCatalog(routes);
  const capability = [{ capabilityId: 'read', summary: 'Read', routeKeys: ['v1:GET:/ok'] }];
  control.register({ productId: 'z-product', version: 'v1', capabilities: capability });
  control.register({ productId: 'a-product', version: 'v1', capabilities: capability });
  assert.deepEqual(control.list().map((p) => p.productId), ['a-product', 'z-product']);
  assert.throws(() => control.register({ productId: 'a-product', version: 'v1', capabilities: capability }), /already exists/);
});
