import { test, expect } from '@playwright/test';

test('productos renderizan', async ({ page }) => {

  await page.goto('http://127.0.0.1:5500/frontend/productos.html');

  // esperar productos
  await page.waitForSelector('.producto');

  // validar que existan productos
  const productos = page.locator('.producto');

  await expect(productos).not.toHaveCount(0);

});

test('productos tienen imagen', async ({ page }) => {

  await page.goto('http://127.0.0.1:5500/frontend/productos.html');

  await page.waitForSelector('.producto img');

  const imagen = page.locator('.producto img').first();

  await expect(imagen).toBeVisible();

});