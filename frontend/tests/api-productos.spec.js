import { test, expect } from '@playwright/test';

test('api productos responde', async ({ request }) => {

  const response = await request.get(
    'http://localhost:3000/api/productos'
  );

  expect(response.status()).toBe(200);

  const data = await response.json();

  expect(data.length).toBeGreaterThan(0);

});