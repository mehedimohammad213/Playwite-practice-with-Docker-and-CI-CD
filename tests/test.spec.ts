const { test, expect } = require('@playwright/test');

test('facebook title', async ({ page }) => {
    await page.goto('https://facebook.com');

    await expect(page).toHaveTitle(/Facebook/);
});