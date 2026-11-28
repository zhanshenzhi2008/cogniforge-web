import { describe, expect, it } from 'vitest'
import {
  listMissingPaletteSettings,
  listPaletteKindsMissingLastVars,
  WORKFLOW_LAST_RESULT_VARS,
  WORKFLOW_NODE_SETTINGS,
  WORKFLOW_SETTINGS_PALETTE,
  workflowNodeSettingsByKind,
} from './workflowNodeSettings'

describe('workflowNodeSettings', () => {
  it('covers every palette node type', () => {
    expect(listMissingPaletteSettings()).toEqual([])
    for (const kind of WORKFLOW_SETTINGS_PALETTE) {
      const spec = workflowNodeSettingsByKind(kind)
      expect(spec, kind).toBeTruthy()
      expect(spec!.inPalette).toBe(true)
      expect(spec!.fields.some(f => f.key === 'name')).toBe(true)
    }
  })

  it('marks input/output as non-palette but documented', () => {
    expect(workflowNodeSettingsByKind('input')?.inPalette).toBe(false)
    expect(workflowNodeSettingsByKind('output')?.inPalette).toBe(false)
    const kinds = WORKFLOW_NODE_SETTINGS.map(s => s.kind)
    expect(kinds).toEqual(expect.arrayContaining(['input', 'output', 'end', 'subflow']))
  })

  it('flags required binds for llm/http/subflow', () => {
    const req = (kind: string) =>
      (workflowNodeSettingsByKind(kind)?.fields || [])
        .filter(f => f.required)
        .map(f => f.key)
    expect(req('llm')).toContain('model')
    expect(req('http')).toContain('httpUrl')
    expect(req('subflow')).toContain('subflowWorkflowId')
    expect(req('condition')).toContain('conditionField')
  })

  it('documents last_* result vars for every writing palette node', () => {
    expect(listPaletteKindsMissingLastVars()).toEqual([])
    expect(WORKFLOW_LAST_RESULT_VARS.length).toBeGreaterThan(20)
    const names = WORKFLOW_LAST_RESULT_VARS.map(v => v.name)
    expect(names).toEqual(expect.arrayContaining([
      'last_agent_content',
      'last_http_ok',
      'last_search_mode',
      'last_wait_decision',
    ]))
    expect(new Set(names).size).toBe(names.length)
  })
})
