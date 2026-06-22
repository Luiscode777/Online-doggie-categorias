import { test, expect } from '@playwright/test';

test('carga pagina principal', async ({ page }) => {

  await page.goto(
    'http://127.0.0.1:5500/frontend/index.html'
  );

  await expect(
    page.getByText('Bienvenido a Online Doggie')
  ).toBeVisible();

});

test('existe formulario contacto', async ({ page }) => {

  await page.goto(
    'http://127.0.0.1:5500/frontend/index.html'
  );

  await expect(
    page.locator('#form-contacto')
  ).toBeVisible();

});

test('existe formulario boletin', async ({ page }) => {

  await page.goto(
    'http://127.0.0.1:5500/frontend/index.html'
  );

  await expect(
    page.locator('#form-boletin')
  ).toBeVisible();

});

test('usuario puede calificar servicio', async ({ page }) => {

  await page.goto(
    'http://127.0.0.1:5500/frontend/index.html'
  );

  await page.locator(
    '.estrella-servicio[data-valor="5"]'
  ).click();

  await page.getByRole('button', {
    name: /enviar calificación/i
  }).click();

  await expect(
    page.locator('#mensaje-calificacion')
  ).toContainText('Gracias');

});

test('navbar muestra usuario autenticado', async ({ page }) => {

  await page.goto(
    'http://127.0.0.1:5500/frontend/Login.html'
  );

  await page.fill('#email', 'Admin@gmail.com');
  await page.fill('#password', 'admin');

  await page.locator(
    '#form-login button[type="submit"]'
  ).click();

  await page.waitForTimeout(3000);

  await page.goto(
    'http://127.0.0.1:5500/frontend/index.html'
  );

  await expect(
    page.locator('.usuario-navbar-item').first()
  ).toBeVisible({ timeout: 10000 });

});


test('admin ve enlace panel admin', async ({ page }) => {

  await page.goto(
    'http://127.0.0.1:5500/frontend/Login.html'
  );

  await page.fill('#email', 'Admin@gmail.com');
  await page.fill('#password', 'admin');

  await page.locator(
    '#form-login button[type="submit"]'
  ).click();

  await page.waitForTimeout(3000);

  await page.goto(
    'http://127.0.0.1:5500/frontend/index.html'
  );

  await expect(
    page.getByText('Panel Admin')
  ).toBeVisible({ timeout: 10000 });

});