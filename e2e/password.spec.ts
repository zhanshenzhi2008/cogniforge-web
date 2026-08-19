import { test, expect } from '@playwright/test'
import { mockBackend, seedLoggedIn } from './helpers'

test.describe('change password e2e', () => {
  test('update button stays disabled until the new password is strong', async ({ page }) => {
    await seedLoggedIn(page)
    await mockBackend(page)
    await page.goto('/settings?section=security')

    const submit = page.getByRole('button', { name: '更新密码' })
    await expect(submit).toBeDisabled()

    await page.getByPlaceholder('请输入当前密码').fill('password123')
    await page.getByPlaceholder('请输入新密码').fill('weak')
    await page.getByPlaceholder('请再次输入新密码').fill('weak')
    await expect(submit).toBeDisabled()
  })

  test('submits with Authorization bearer via useApi, not a naked $fetch', async ({ page }) => {
    await seedLoggedIn(page)
    await mockBackend(page)
    await page.goto('/settings?section=security')

    await page.getByPlaceholder('请输入当前密码').fill('password123')
    await page.getByPlaceholder('请输入新密码').fill('NewPass1!')
    await page.getByPlaceholder('请再次输入新密码').fill('NewPass1!')

    const submit = page.getByRole('button', { name: '更新密码' })
    await expect(submit).toBeEnabled()

    const reqPromise = page.waitForRequest((req) =>
      req.method() === 'POST' && req.url().includes('/api/v1/settings/password'),
    )
    await submit.click()
    const req = await reqPromise

    expect(req.headers().authorization).toBe('Bearer e2e-token')
    const body = req.postDataJSON() as { old_password?: string; new_password?: string }
    expect(body.old_password).toBe('password123')
    expect(body.new_password).toBe('NewPass1!')
    await expect(page.getByText('密码修改成功')).toBeVisible()
  })
})
