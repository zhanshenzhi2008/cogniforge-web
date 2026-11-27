import { describe, expect, it } from 'vitest'
import { WORKFLOW_PALETTE_TYPES } from './workflowNodeMeta'
import {
  listMissingPaletteSettings,
  WORKFLOW_NODE_SETTINGS,
  workflowNodeSettingsByKind,
} from './workflowNodeSettings'

describe('workflowNodeSettings', () => {
  it('covers every palette node type', () => {
    expect(listMissingPaletteSettings()).toEqual([])
    for (const kind of WORKFLOW_PALETTE_TYPES) {
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
})
