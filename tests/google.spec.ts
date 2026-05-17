const { test, expect } = require('@playwright/test');

test('google title', async ({ page }) => {
    await page.goto('https://google.com');

    await expect(page).toHaveTitle(/Google/);
});