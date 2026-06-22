import { test, expect } from '@playwright/test';

test('registro valida email incorrecto', async ({ page }) => {

  await page.goto(
    'http://127.0.0.1:5500/frontend/registro.html'
  );

  page.once('dialog', dialog => {
    expect(dialog.message())
      .toContain('correo no es válido');
    dialog.accept();
  });

  await page.fill('#nombre', 'Usuario Test');
  await page.fill('#email', 'correo-invalido');
  await page.fill('#password', '12345678');
  await page.fill('#direccion', 'Calle Test');

  await page.click('button[type="submit"]');

});

test('registro valida contraseña corta', async ({ page }) => {

  await page.goto(
    'http://127.0.0.1:5500/frontend/registro.html'
  );

  page.once('dialog', dialog => {
    expect(dialog.message())
      .toContain('mínimo 8 caracteres');
    dialog.accept();
  });

  await page.fill('#nombre', 'Usuario Test');
  await page.fill('#email', 'test@test.com');
  await page.fill('#password', '123');
  await page.fill('#direccion', 'Calle Test');

  await page.click('button[type="submit"]');

});