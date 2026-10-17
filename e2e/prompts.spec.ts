import { test, expect, type Page, type Route } from '@playwright/test'
import { mockBackend, ok, seedLoggedIn } from './helpers'

type Prompt = {
  id: string
  name: string
  description?: string
  current_version_id?: string
  created_at: string
  updated_at: string
}

type PromptVersion = {
  id: string
  prompt_id: string
  version: number
  status: string
  content: string
  changelog?: string
  created_at: string
}

/** In-memory prompts API for e2e (no real Go). Register AFTER mockBackend (LIFO). */
async function mockPromptAPI(page: Page) {
  const items: Prompt[] = []
  const versions = new Map<string, PromptVersion[]>()
  const now = () => new Date().toISOString()

  await page.route(/\/api\/v1\/prompts/, async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname
    const method = req.method()

    const json = async (data: unknown, status = 200) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(ok(data)),
      })
    }

    if (method === 'GET' && path.endsWith('/api/v1/prompts')) {
      await json(items)
      return
    }

    if (method === 'POST' && path.endsWith('/api/v1/prompts')) {
      const body = req.postDataJSON() as {
        name?: string
        description?: string
        content?: string
      }
      const id = `p-${items.length + 1}`
      const vid = `pv-${items.length + 1}`
      const p: Prompt = {
        id,
        name: body.name || 'unnamed',
        description: body.description,
        current_version_id: vid,
        created_at: now(),
        updated_at: now(),
      }
      const v: PromptVersion = {
        id: vid,
        prompt_id: id,
        version: 1,
        status: 'published',
        content: body.content || '',
        created_at: now(),
      }
      items.push(p)
      versions.set(id, [v])
      await json({ prompt: p, current_version: v })
      return
    }

    const verOne = path.match(/\/api\/v1\/prompts\/versions\/([^/]+)$/)
    if (verOne && method === 'DELETE') {
      const vid = verOne[1]
      for (const [pid, list] of versions) {
        const idx = list.findIndex(v => v.id === vid)
        if (idx < 0) continue
        if (list.length <= 1) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ code: 400, message: '至少保留一个版本', data: null }),
          })
          return
        }
        list.splice(idx, 1)
        versions.set(pid, list)
        const p = items.find(x => x.id === pid)
        if (p && p.current_version_id === vid) {
          p.current_version_id = list[0]?.id
          p.updated_at = now()
        }
        await json(null)
        return
      }
    }

    const currentVer = path.match(/\/api\/v1\/prompts\/([^/]+)\/current-version$/)
    if (currentVer && method === 'PUT') {
      const pid = currentVer[1]
      const body = req.postDataJSON() as { version_id?: string }
      const p = items.find(x => x.id === pid)
      if (p && body.version_id) {
        p.current_version_id = body.version_id
        p.updated_at = now()
        await json(p)
        return
      }
    }

    const verList = path.match(/\/api\/v1\/prompts\/([^/]+)\/versions$/)
    if (verList) {
      const pid = verList[1]
      if (method === 'GET') {
        await json(versions.get(pid) || [])
        return
      }
      if (method === 'POST') {
        const body = req.postDataJSON() as { content?: string; changelog?: string; publish?: boolean }
        const list = versions.get(pid) || []
        const publish = body.publish !== false
        const v: PromptVersion = {
          id: `pv-${pid}-${list.length + 1}`,
          prompt_id: pid,
          version: list.length + 1,
          status: publish ? 'published' : 'draft',
          content: body.content || '',
          changelog: body.changelog,
          created_at: now(),
        }
        list.unshift(v)
        versions.set(pid, list)
        const p = items.find(x => x.id === pid)
        if (p && publish) {
          p.current_version_id = v.id
          p.updated_at = now()
        }
        await json(v)
        return
      }
    }

    if (method === 'DELETE' && path.match(/\/api\/v1\/prompts\/[^/]+$/)) {
      const id = path.split('/').pop()!
      const idx = items.findIndex(p => p.id === id)
      if (idx >= 0) items.splice(idx, 1)
      versions.delete(id)
      await json(null)
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(ok({})),
    })
  })
}

test.describe('prompts e2e', () => {
  test('empty state then create prompt and new version', async ({ page }) => {
    await seedLoggedIn(page)
    await mockBackend(page)
    await mockPromptAPI(page)

    await page.goto('/prompts')
    await expect(page.getByRole('heading', { name: '提示词' })).toBeVisible()
    await expect(page.getByText('还没有提示词')).toBeVisible()

    await page.getByRole('button', { name: '新建提示词' }).click()
    await page.getByPlaceholder('例如：客服人设').fill('客服人设')
    await page.getByPlaceholder('可选说明').fill('e2e')
    await page.getByPlaceholder('System prompt 正文').fill('你是客服助手')
    await page.getByRole('button', { name: '创建' }).click()

    await expect(page.getByRole('heading', { name: '客服人设' })).toBeVisible()
    await expect(page.getByText('你是客服助手')).toBeVisible()
    await expect(page.getByText('v1')).toBeVisible()

    await page.getByRole('button', { name: '发布新版本' }).click()
    await page.getByPlaceholder('System prompt 正文').fill('你是严格的客服，只答政策')
    await page.getByPlaceholder('本版改了什么').fill('更严格')
    await page.getByRole('button', { name: '创建' }).click()

    await expect(page.getByText('你是严格的客服，只答政策')).toBeVisible()
    await expect(page.getByText('v2')).toBeVisible()

    // 删除旧版 v1（列表按 version DESC，v2 在上；卡片内最后一个 icon 为删）
    const verCards = page.locator('.ver-card')
    await expect(verCards).toHaveCount(2)
    await verCards.nth(1).locator('button').last().click()
    await page.locator('[role="dialog"]').getByRole('button', { name: '删除' }).click()
    await expect(verCards).toHaveCount(1)
  })
})
