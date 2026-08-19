import { test, expect } from '@playwright/test'
import { mockBackend, seedLoggedIn } from './helpers'

test.describe('sessions settings e2e', () => {
  test('other-sessions finishes loading and does not hang on Nuxt $fetch', async ({ page }) => {
    await seedLoggedIn(page)
    await mockBackend(page)

    const reqPromise = page.waitForRequest((req) =>
      req.method() === 'GET' && req.url().includes('/api/v1/settings/sessions'),
    )
    await page.goto('/settings?section=sessions')

    const req = await reqPromise
    expect(req.headers().authorization).toBe('Bearer e2e-token')

    await expect(page.getByText('Loading…').or(page.getByText('加载中…'))).toHaveCount(0, { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /Sessions|会话/ }).first()).toBeVisible()
  })
})
