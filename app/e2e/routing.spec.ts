import { expect, test } from '@playwright/test';

test.describe('routing', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByText('Games', { exact: true }).first()
    ).toBeVisible();
  });

  test('prefills the game code from a ?code= search param', async ({
    page
  }) => {
    await page.goto('/join?code=ABCD');
    await expect(page.locator('#codeInput')).toHaveValue('abcd');
  });

  test('leaves the code field empty with no search param', async ({ page }) => {
    await page.goto('/join');
    await expect(page.locator('#codeInput')).toHaveValue('');
  });

  test('redirects home when visiting a protected route without a session', async ({
    page
  }) => {
    await page.goto('/story');
    await expect(page).toHaveURL('/');
  });

  test('redirects home for an unknown path', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page).toHaveURL('/');
  });

  test('navbar home link returns to /', async ({ page }) => {
    await page.goto('/privacy');
    await page.locator('a.navbar-brand').first().click();
    await expect(page).toHaveURL('/');
  });

  test('resolves the story archive route for an arbitrary game id', async ({
    page
  }) => {
    await page.goto('/story/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL('/story/00000000-0000-0000-0000-000000000000');
  });

  test('supports browser back/forward between routes', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Join Game').first().click();
    await expect(page).toHaveURL('/join');

    await page.goBack();
    await expect(page).toHaveURL('/');

    await page.goForward();
    await expect(page).toHaveURL('/join');
  });
});
