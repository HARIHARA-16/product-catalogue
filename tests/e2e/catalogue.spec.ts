import { test, expect } from '@playwright/test';

const mailpit = process.env.MAILPIT_URL || 'http://localhost:8025';

test('home features the chosen five and renders product images without overflow', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const featured = page.getByRole('region', { name: 'Featured products' });
  await expect(featured.getByRole('article')).toHaveCount(5);
  const links = await featured.locator('.product-link').evaluateAll((elements) => elements.map((element) => element.getAttribute('href')));
  expect(links).toEqual(['/products/1', '/products/5', '/products/9', '/products/16', '/products/19']);
  await expect(page.getByRole('article')).toHaveCount(20);
  await expect.poll(() => page.locator('.featured-grid img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('category contains ranked highlights and additional products', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Product categories' }).getByRole('link', { name: 'Menswear', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Menswear.' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Top-rated products' }).getByRole('article')).toHaveCount(3);
  await expect(page.getByRole('region', { name: 'More in Menswear' }).getByRole('article')).toHaveCount(1);
  const result = await page.request.get('/api/products?category=men%27s%20clothing');
  const body = await result.json();
  expect(body.featured.map((product: { id: number }) => product.id)).toEqual([3, 2, 1]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('search returns matching text only, with an empty state and working detail link', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search products' }).fill('BACKPACK');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('article').getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Fjallraven');
  await page.getByRole('searchbox', { name: 'Search products' }).fill('no-such-product-74829');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No products found.' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
});

test('validates contact details, sends real SMTP email and shows thanks', async ({ page, request }, testInfo) => {
  const uniqueMessage = `Could you confirm availability? browser-${testInfo.project.name}-${Date.now()}`;
  await page.goto('/products/1');
  await expect.poll(() => page.locator('.detail-image img').evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('product.png') });
  await page.getByRole('button', { name: 'Enquire about this product' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Submit enquiry' }).click();
  await expect(dialog.getByText('Enter your name (at least 2 characters).')).toBeVisible();
  await dialog.getByLabel('Full name').fill('Browser Reviewer');
  await dialog.getByLabel('Email address').fill('reviewer@example.test');
  await dialog.getByLabel('How can we help?').fill(uniqueMessage);
  await expect(dialog.locator('.field-error')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await dialog.evaluate((element) => { element.scrollTop = 0; });
  await page.screenshot({ path: testInfo.outputPath('enquiry.png') });
  await dialog.getByRole('button', { name: 'Submit enquiry' }).click();
  await expect(dialog.getByRole('heading', { name: 'Thank you for getting in touch.' })).toBeVisible();

  await expect.poll(async () => {
    const inbox = await request.get(`${mailpit}/api/v1/messages`);
    const { messages } = await inbox.json();
    for (const mail of (messages as { ID: string; Subject: string }[]).slice(0, 10)) {
      const response = await request.get(`${mailpit}/api/v1/message/${mail.ID}`);
      const detail = await response.json();
      if (String(detail.Text).includes(uniqueMessage)) {
        expect(detail.Subject).toBe('Product enquiry #1');
        expect(detail.To[0].Address).toBe('sales@example.test');
        expect(detail.ReplyTo[0].Address).toBe('reviewer@example.test');
        return true;
      }
    }
    return false;
  }, { timeout: 10000 }).toBe(true);
  await dialog.getByRole('button', { name: 'Back to the product' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Enquire about this product' })).toBeFocused();
});

test('unknown products show a recoverable error', async ({ page }) => {
  await page.goto('/products/99999');
  await expect(page.getByRole('alert')).toContainText('Product not found.');
  await page.getByRole('link', { name: 'Return to all products' }).click();
  await expect(page.getByRole('heading', { name: 'The collection.' })).toBeVisible();
});