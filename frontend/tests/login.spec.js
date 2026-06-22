import { test, expect } from '@playwright/test';

test('login correcto', async ({ page }) => {

  await page.goto(
    'http://127.0.0.1:5500/frontend/Login.html'
  );

  await page.fill(
    '#email',
    'Admin@gmail.com'
  );

  await page.fill(
    '#password',
    'admin'
  );

  await page.click('#btn-login');

  // Esperar que salga de Login
  await page.waitForURL(
    url => !url.pathname.toLowerCase().includes('login.html'),
    { timeout: 10000 }
  );

  await expect(page).not.toHaveURL(
    /login\.html/i
  );

});