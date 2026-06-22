import { test, expect } from '@playwright/test';

test('agregar producto carrito', async ({ page }) => {

  await page.goto('http://127.0.0.1:5500/frontend/productos.html');

  await page.waitForSelector('.btn-agregar');

  // agregar producto
  await page.locator('.btn-agregar').first().click();

  // abrir mini carrito
  await page.click('.carrito-flotante');

  // validar contador
  await expect(
    page.locator('#contador-carrito')
  ).not.toHaveText('0');

});

test('carrito muestra total', async ({ page }) => {

  await page.goto(
    'http://127.0.0.1:5500/frontend/carrito.html'
  );

  await expect(
    page.locator('#total')
  ).toContainText('Total');

});