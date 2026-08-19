import type { Page, Route } from '@playwright/test'

export function ok(data: unknown) {
  return {
    code: 2000,
    message: '成功',
    data,
  }
}

export function quotaSnap(kind: 'ok' | 'gone' | 'admin' = 'ok') {
  if (kind === 'admin') {
    return {
      unlimited: true,
      warn: false,
      admin_unlimited: true,
      day: { requests_used: 3, requests_limit: 30, tokens_used: 100, tokens_limit: 100000, resets_at: new Date().toISOString() },
      month: { tokens_used: 100, tokens_limit: 1000000, resets_at: new Date().toISOString() },
    }
  }
  if (kind === 'gone') {
    return {
      unlimited: false,
      warn: true,
      admin_unlimited: true,
      day: { requests_used: 30, requests_limit: 30, tokens_used: 100, tokens_limit: 100000, resets_at: new Date().toISOString() },
      month: { tokens_used: 100, tokens_limit: 1000000, resets_at: new Date().toISOString() },
    }
  }
  return {
    unlimited: false,
    warn: false,
    admin_unlimited: true,
    day: { requests_used: 3, requests_limit: 30, tokens_used: 100, tokens_limit: 100000, resets_at: new Date().toISOString() },
    month: { tokens_used: 100, tokens_limit: 1000000, resets_at: new Date().toISOString() },
  }
}

const e2eUser = {
  id: 'u-e2e',
  email: 'e2e@example.com',
  name: 'E2E User',
  role: 'user',
}

/** Intercept Go APIs so e2e does not need a running backend. */
export async function mockBackend(page: Page, opts: { quota?: 'ok' | 'gone' | 'admin' } = {}) {
  const quota = quotaSnap(opts.quota ?? 'ok')

  await page.route(/\/api\/v1\//, async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname
    const method = req.method()

    if (method === 'POST' && path.endsWith('/api/v1/auth/login')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ token: 'e2e-token', user: e2eUser })),
      })
      return
    }

    if (method === 'GET' && path.endsWith('/api/v1/quota/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok(quota)),
      })
      return
    }

    if (method === 'GET' && path.endsWith('/api/v1/settings/sessions')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok([])),
      })
      return
    }

    if (method === 'GET' && path.endsWith('/api/v1/models')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok({ models: [{ id: 'deepseek-chat', name: 'deepseek-chat', object: 'model', created: 0, owned_by: 'deepseek', description: '' }] })),
      })
      return
    }

    if (method === 'GET' && /\/api\/v1\/(agents|conversations|workflows|knowledge|keys)$/.test(path)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ok([])),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ok({})),
    })
  })
}

export async function seedLoggedIn(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'e2e-token')
    localStorage.setItem('user', JSON.stringify({
      id: 'u-e2e',
      email: 'e2e@example.com',
      name: 'E2E User',
      role: 'user',
    }))
    localStorage.setItem('cf-locale', 'zh-CN')
  })
}
