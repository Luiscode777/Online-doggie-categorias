import { test, expect } from '@playwright/test';

async function loginAdmin(page) {

  await page.goto('http://127.0.0.1:5500/frontend/Login.html');

  await page.fill('#email', 'Admin@gmail.com');
  await page.fill('#password', 'admin');

  await page.locator('#form-login button[type="submit"]').click();

  await expect(page).toHaveURL(/admin\.html/i);

}

test('admin crea producto', async ({ page }) => {

  await loginAdmin(page);

  const nombre = `Producto Test ${Date.now()}`;

  await page.fill('#nombre', nombre);

  await page.fill(
    '#descripcion',
    'Producto creado por Playwright'
  );

  await page.fill('#precio', '10000');

  await page.selectOption('#categoria', {
    index: 1
  });

  await page.fill('#stock', '5');

  await page.setInputFiles(
    '#imagen',
    'tests/assets/imagendepruebadetests.avif'
  );

  page.once('dialog', dialog => dialog.accept());

  await page.locator(
    '#form-producto button[type="submit"]'
  ).click();

  await expect(
    page.locator('#lista-productos')
  ).toContainText(nombre);

});

test('admin edita producto', async ({ page }) => {

  await loginAdmin(page);

  await page.getByText('Editar').first().click();

  await expect(
    page.locator('#form-producto button[type="submit"]')
  ).toHaveText(/actualizar producto/i);

  await page.fill('#precio', '99999');

  page.once('dialog', dialog => dialog.accept());

  await page.locator('#form-producto').evaluate(form => {
    form.requestSubmit();
  });

  await page.waitForTimeout(2000);

});

test('admin elimina producto', async ({ page }) => {

  await loginAdmin(page);

  page.once('dialog', dialog => dialog.accept());

  await page.getByText('Eliminar').last().click();

  await page.waitForTimeout(2000);

});

test('admin actualiza stock', async ({ page }) => {

  await loginAdmin(page);

  const inputStock =
    page.locator('.stock-input').first();

  await inputStock.fill('25');

  page.once('dialog', dialog => dialog.accept());

  await page.getByRole('button', {
    name: 'Actualizar'
  }).first().click();

  await page.waitForTimeout(2000);

});

test('admin carga metricas', async ({ page }) => {

  await loginAdmin(page);

  await expect(
    page.locator('#met-productos')
  ).not.toHaveText('-');

  await expect(
    page.locator('#met-usuarios')
  ).not.toHaveText('-');

  await expect(
    page.locator('#met-ventas')
  ).not.toHaveText('-');

});