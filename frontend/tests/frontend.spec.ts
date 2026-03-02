/**
 * Frontend UI Tests for FPL Optimizer
 * Run with: npx playwright test
 */
import { test, expect } from '@playwright/test';

test.describe('FPL Optimizer Frontend', () => {

  test.beforeEach(async ({ page }) => {
    // Mock API routes
    await page.route('**/health', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'healthy' }),
      });
    });

    await page.route('**/api/fpl/current-gw', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ gameweek: 28 }),
      });
    });

    // Go to the frontend
    await page.goto('http://localhost:3000');
  });

  test('should load the main page', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('FPL');
    await expect(page.locator('h1')).toContainText('Optimizer');

    // Check main elements exist
    await expect(page.getByText('Configure Optimization')).toBeVisible();
    await expect(page.locator('label:has-text("FPL Team URL")')).toBeVisible();
  });

  test('should show backend connection status', async ({ page }) => {
    // Should show backend status indicator
    await expect(page.getByText('Backend:')).toBeVisible({ timeout: 10000 });
  });

  test('should accept team URL input', async ({ page }) => {
    const urlInput = page.getByPlaceholder(/fantasy\.premierleague\.com/);
    await expect(urlInput).toBeVisible();
    
    // Enter a test URL
    await urlInput.fill('https://fantasy.premierleague.com/entry/7505923/event/28');
  });

  test('should have horizon slider', async ({ page }) => {
    // Check horizon slider exists
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    
    // Check it has correct min/max
    await expect(slider).toHaveAttribute('min', '1');
    await expect(slider).toHaveAttribute('max', '4');
  });

  test('should have chip selection buttons', async ({ page }) => {
    // Check chip buttons exist
    await expect(page.getByText('WILDCARD')).toBeVisible();
    await expect(page.getByText('FREE HIT')).toBeVisible();
    await expect(page.getByText('BENCH BOOST')).toBeVisible();
    await expect(page.getByText('TRIPLE CAPTAIN')).toBeVisible();
  });

  test('should have optimize button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Run Optimization/i })).toBeVisible();
  });

  test('should show error for empty URL', async ({ page }) => {
    // Click optimize without URL
    await page.getByRole('button', { name: /Run Optimization/i }).click();
    
    // Should show error message
    await expect(page.getByText(/Please enter your FPL team URL/i)).toBeVisible();
  });

  test('should validate URL format', async ({ page }) => {
    // Enter invalid URL
    const urlInput = page.getByPlaceholder(/fantasy\.premierleague\.com/);
    await urlInput.fill('invalid-url');
    
    // Click optimize
    await page.getByRole('button', { name: /Run Optimization/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/Invalid URL/i)).toBeVisible();
  });
});

test.describe('FPL Optimizer - Integration', () => {

  test('should run optimization with valid team', async ({ page }) => {
    // Mock all API routes
    await page.route('**/health', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'healthy' }),
      });
    });

    await page.route('**/api/fpl/current-gw', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ gameweek: 28 }),
      });
    });

    await page.route('**/api/fpl/optimize', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Optimization complete',
          optimized_squad: [
            { id: 1, web_name: 'Player 1', element_type: 1, team: 1, price: 50, position: 1, is_captain: false, is_vice_captain: false, bench_order: 0 },
            { id: 2, web_name: 'Player 2', element_type: 2, team: 2, price: 55, position: 1, is_captain: true, is_vice_captain: false, bench_order: 0 },
          ],
          starting_xi: [
            { id: 1, web_name: 'Player 1', element_type: 1, team: 1, price: 50, position: 1, is_captain: false, is_vice_captain: false, bench_order: 0 },
            { id: 2, web_name: 'Player 2', element_type: 2, team: 2, price: 55, position: 1, is_captain: true, is_vice_captain: false, bench_order: 0 },
          ],
          bench: [],
          current_expected_points: 45,
          optimized_expected_points: 52,
          points_difference: 7,
        }),
      });
    });

    await page.goto('http://localhost:3000');

    // Wait for backend to be ready
    await expect(page.getByText('Backend:')).toBeVisible({ timeout: 30000 });

    // Enter team URL
    const urlInput = page.getByPlaceholder(/fantasy\.premierleague\.com/);
    await urlInput.fill('https://fantasy.premierleague.com/entry/7505923/event/28');

    // Click optimize
    await page.getByRole('button', { name: /Run Optimization/i }).click();

    // Wait for results
    await expect(page.getByText('Expected Points Comparison')).toBeVisible({ timeout: 10000 });
  });
});
