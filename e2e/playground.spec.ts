import { test, expect } from '@playwright/test'
import { mockBackend, seedLoggedIn } from './helpers'

test.describe('playground quota e2e', () => {
  test.beforeEach(async ({ page }) => {
    await seedLoggedIn(page)
  })

  test('empty composer disables send; typing enables solid primary send', async ({ page }) => {
    await mockBackend(page, { quota: 'ok' })
    await page.goto('/playground')
    await expect(page.getByText('AI 对话')).toBeVisible()

    const send = page.locator('.composer-prompt button.cf-btn--primary')
    await expect(send).toBeVisible()
    await expect(send).toBeDisabled()

    const box = page.getByPlaceholder(/输入消息/)
    await box.fill('你好')
    await expect(send).toBeEnabled()
    await expect(send).toHaveClass(/cf-btn--primary/)
  })

  test('exhausted quota greys out send and shows used-up placeholder', async ({ page }) => {
    await mockBackend(page, { quota: 'gone' })
    await page.goto('/playground')

    await expect(page.getByPlaceholder('今日额度已用完')).toBeVisible()
    const send = page.locator('.composer-prompt button.cf-btn--primary')
    await expect(send).toBeDisabled()
  })
})
