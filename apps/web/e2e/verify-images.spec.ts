import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:30001';

test.describe('Experience Image Verification', () => {
  const experiences = [
    {
      slug: '交通银行待遇大曝光',
      expectedCoverSrc: 'https://store.yinhangbang.com/experiences/images/8cedd943e6c653a72e0e7efe762b1ec3.jpg'
    },
    {
      slug: '工商银行业务研发中心待遇大曝光',
      expectedCoverSrc: 'https://store.yinhangbang.com/experiences/images/05fb80ffb6e6165c6c72fa68633be595.jpg'
    }
  ];

  for (const exp of experiences) {
    test(`should render cover image for ${exp.slug}`, async ({ page }) => {
      // Navigate to the experience page
      await page.goto(`${BASE_URL}/experiences/${encodeURIComponent(exp.slug)}`);

      // Wait for the page to load
      await page.waitForLoadState('networkidle');

      // Check for the cover image
      const coverImage = page.locator('img[alt="cover_image"]');
      await expect(coverImage).toBeVisible();

      // Verify the src attribute
      const src = await coverImage.getAttribute('src');
      expect(src).toBe(exp.expectedCoverSrc);

      // Verify the image has dimensions (is loaded)
      const box = await coverImage.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);

      // Check natural width/height via JS evaluation
      const isLoaded = await coverImage.evaluate((img: HTMLImageElement) => {
        return img.naturalWidth > 0 && img.naturalHeight > 0;
      });
      expect(isLoaded).toBe(true);
    });
  }
});
