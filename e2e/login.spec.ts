import { test, expect } from '@playwright/test'
import { mockBackend } from './helpers'

test.describe('login e2e', () => {
  test('sign-in button is solid primary and enabled', async ({ page }) => {
    await mockBackend(page)
    await page.goto('/login')

    const submit = page.locator('button.cf-btn--primary.auth-submit')
    await expect(submit).toBeVisible()
    await expect(submit).toBeEnabled()
    await expect(submit).toContainText('登录')
    await expect(submit).toHaveClass(/cf-btn--primary/)
  })

  test('empty submit shows validation and keeps the button clickable', async ({ page }) => {
    await mockBackend(page)
    await page.goto('/login')

    await page.locator('button.auth-submit').click()
    await expect(page.getByText('请输入邮箱或用户名')).toBeVisible()
    await expect(page.getByText('请输入密码')).toBeVisible()
    await expect(page.locator('button.auth-submit')).toBeEnabled()
  })

  test('successful login lands on dashboard with a solid primary CTA', async ({ page }) => {
    await mockBackend(page)
    await page.goto('/login')

    await page.locator('#login-account').fill('e2e@example.com')
    await page.locator('#login-password').fill('secret1')
    await page.locator('button.auth-submit').click()

    await expect(page).toHaveURL(/\/$/)
    const cta = page.getByRole('button', { name: '打开对话' })
    await expect(cta).toBeVisible()
    await expect(cta).toBeEnabled()
    await expect(cta).toHaveClass(/cf-btn--primary/)
  })
})

test.describe('register e2e', () => {
  test('create-account button is solid primary', async ({ page }) => {
    await mockBackend(page)
    await page.goto('/register')

    const submit = page.locator('button.cf-btn--primary.auth-submit')
    await expect(submit).toBeVisible()
    await expect(submit).toBeEnabled()
    await expect(submit).toContainText('注册')
  })
})
