import { describe, expect, it } from 'vitest'
import { buildVariableMap, initVarFormValues, missingRequiredVars } from '../promptVars'

describe('promptVars', () => {
  const defs = [
    { name: 'brand', default: 'CF', required: true },
    { name: 'tone', default: '', required: false },
  ]

  it('initVarFormValues prefills defaults', () => {
    expect(initVarFormValues(defs)).toEqual({ brand: 'CF', tone: '' })
  })

  it('missingRequiredVars ignores filled defaults', () => {
    expect(missingRequiredVars(defs, {})).toEqual([])
    expect(missingRequiredVars(defs, { brand: 'X' })).toEqual([])
  })

  it('missingRequiredVars reports empty required without default', () => {
    const noDefault = [{ name: 'brand', default: '', required: true }]
    expect(missingRequiredVars(noDefault, {})).toEqual(['brand'])
    expect(missingRequiredVars(noDefault, { brand: '  ' })).toEqual(['brand'])
  })

  it('buildVariableMap merges values over defaults', () => {
    expect(buildVariableMap(defs, { brand: 'Acme', tone: 'warm' })).toEqual({
      brand: 'Acme',
      tone: 'warm',
    })
    expect(buildVariableMap(defs, {})).toEqual({ brand: 'CF' })
  })
})
