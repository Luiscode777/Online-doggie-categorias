import { test, expect } from '@playwright/test';

test('filtrar categoria perros', async ({ page }) => {

  await page.goto('http://127.0.0.1:5500/frontend/productos.html');

  await page.waitForSelector('.producto');

  await page.selectOption('#categoria', 'perros');

  await page.waitForTimeout(1000);

  await expect(
    page.locator('.producto')
  ).not.toHaveCount(0);

});

test('buscar producto', async ({ page }) => {

  await page.goto('http://127.0.0.1:5500/frontend/productos.html');

  await page.fill('#buscador', 'dog');

  await page.waitForTimeout(1000);

  await expect(
    page.locator('.producto')
  ).not.toHaveCount(0);

});