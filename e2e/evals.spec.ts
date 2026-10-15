import { test, expect, type Page, type Route } from '@playwright/test'
import { mockBackend, ok, seedLoggedIn } from './helpers'

type Suite = {
  id: string
  name: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string
}

type Case = {
  id: string
  suite_id: string
  input: string
  expected?: string
  judge_type: string
  weight: number
  sort_order: number
}

/** In-memory eval API for e2e (no real Go). Must register AFTER mockBackend (LIFO). */
async function mockEvalAPI(page: Page) {
  const suites: Suite[] = []
  const cases = new Map<string, Case[]>()
  const now = () => new Date().toISOString()

  await page.route(/\/api\/v1\/evals\//, async (route: Route) => {
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

    if (method === 'GET' && path.endsWith('/api/v1/evals/suites')) {
      await json(suites)
      return
    }

    if (method === 'POST' && path.endsWith('/api/v1/evals/suites')) {
      const body = req.postDataJSON() as { name?: string; description?: string }
      const s: Suite = {
        id: `suite-${suites.length + 1}`,
        name: body.name || 'unnamed',
        description: body.description,
        user_id: 'u-e2e',
        created_at: now(),
        updated_at: now(),
      }
      suites.push(s)
      cases.set(s.id, [])
      await json(s)
      return
    }

    const suiteMatch = path.match(/\/api\/v1\/evals\/suites\/([^/]+)(?:\/(cases|runs))?$/)
    if (suiteMatch) {
      const suiteId = suiteMatch[1]
      const sub = suiteMatch[2]
      const suite = suites.find(s => s.id === suiteId)

      if (method === 'GET' && !sub) {
        if (!suite) {
          await json(null, 404)
          return
        }
        await json(suite)
        return
      }

      if (method === 'DELETE' && !sub) {
        const idx = suites.findIndex(s => s.id === suiteId)
        if (idx >= 0) suites.splice(idx, 1)
        cases.delete(suiteId)
        await json(null)
        return
      }

      if (method === 'GET' && sub === 'cases') {
        await json(cases.get(suiteId) || [])
        return
      }

      if (method === 'POST' && sub === 'cases') {
        const body = req.postDataJSON() as { input?: string; expected?: string; judge_type?: string }
        const list = cases.get(suiteId) || []
        const c: Case = {
          id: `case-${list.length + 1}`,
          suite_id: suiteId,
          input: body.input || '',
          expected: body.expected,
          judge_type: body.judge_type || 'contains',
          weight: 1,
          sort_order: list.length,
        }
        list.push(c)
        cases.set(suiteId, list)
        await json(c)
        return
      }

      if (method === 'POST' && sub === 'runs') {
        const body = req.postDataJSON() as { target_type?: string; target_id?: string }
        const list = cases.get(suiteId) || []
        const results = list.map((c, i) => ({
          id: `res-${i}`,
          run_id: 'run-1',
          case_id: c.id,
          status: 'pass',
          score: 1,
          actual_output: `mock answer for ${c.input}`,
          latency_ms: 12,
        }))
        await json({
          run: {
            id: 'run-1',
            suite_id: suiteId,
            target_type: body.target_type || 'model',
            target_id: body.target_id || 'deepseek-chat',
            status: 'completed',
            pass_count: results.length,
            fail_count: 0,
            skip_count: 0,
            score: 1,
            created_at: now(),
          },
          results,
        })
        return
      }
    }

    if (method === 'DELETE' && path.includes('/api/v1/evals/cases/')) {
      const caseId = path.split('/').pop()!
      for (const [sid, list] of cases) {
        const next = list.filter(c => c.id !== caseId)
        if (next.length !== list.length) {
          cases.set(sid, next)
          break
        }
      }
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

test.describe('evals e2e', () => {
  test('empty state then create suite, add case, run eval', async ({ page }) => {
    await seedLoggedIn(page)
    await mockBackend(page)
    await mockEvalAPI(page)

    await page.goto('/evals')
    await expect(page.getByRole('heading', { name: '评估' })).toBeVisible()
    await expect(page.getByText('还没有评测集')).toBeVisible()

    await page.getByRole('button', { name: '新建评测集' }).click()
    await page.getByPlaceholder('例如：客服 FAQ v1').fill('天气卷')
    await page.getByPlaceholder('可选说明').fill('e2e')
    await page.getByRole('button', { name: '创建' }).click()

    await expect(page.getByRole('heading', { name: '天气卷' })).toBeVisible()
    await expect(page.getByText('先添加至少一条用例再运行')).toBeVisible()

    await page.getByRole('button', { name: '添加用例' }).click()
    await page.getByPlaceholder('提问').fill('北京今天天气怎么样')
    await page.getByPlaceholder('期望（关键词逗号分隔）').fill('北京,天气')
    await page.getByRole('button', { name: '创建' }).click()

    await expect(page.getByText('北京今天天气怎么样')).toBeVisible()

    await page.getByPlaceholder('与模型页 default_model 一致').fill('deepseek-chat')
    await expect(page.getByRole('button', { name: '运行评测' })).toBeEnabled()
    await page.getByRole('button', { name: '运行评测' }).click()

    await expect(page.getByText(/得分:\s*100%/)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/通过 1/)).toBeVisible()
    await expect(page.getByText(/mock answer for 北京今天天气怎么样/)).toBeVisible()
  })

  test('create button is solid primary on list', async ({ page }) => {
    await seedLoggedIn(page)
    await mockBackend(page)
    await mockEvalAPI(page)
    await page.goto('/evals')

    const btn = page.getByRole('button', { name: '新建评测集' })
    await expect(btn).toBeVisible()
    await expect(btn).toHaveClass(/cf-btn--primary/)
  })
})
