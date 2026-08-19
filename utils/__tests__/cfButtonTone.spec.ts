import { describe, expect, it } from 'vitest'
import { cfButtonRootClass, mapCfButtonTone, type CfButtonTone } from '../cfButtonTone'

describe('mapCfButtonTone', () => {
  it('maps login/save/confirm to solid primary', () => {
    expect(mapCfButtonTone('primary')).toEqual({
      color: 'primary',
      variant: 'solid',
      size: 'md',
    })
  })

  it('maps cancel/back to outline, not a washed-out fill', () => {
    expect(mapCfButtonTone('secondary')).toEqual({
      color: 'neutral',
      variant: 'outline',
      size: 'md',
    })
  })

  it('maps delete confirm to solid danger', () => {
    expect(mapCfButtonTone('danger')).toEqual({
      color: 'error',
      variant: 'solid',
      size: 'md',
    })
  })

  it('keeps row icons ghost so they are not mistaken for the main CTA', () => {
    expect(mapCfButtonTone('icon').variant).toBe('ghost')
    expect(mapCfButtonTone('icon-accent')).toMatchObject({ color: 'primary', variant: 'ghost' })
    expect(mapCfButtonTone('icon-danger')).toMatchObject({ color: 'error', variant: 'ghost' })
  })

  it('never uses soft for any tone (soft looks disabled)', () => {
    const tones: CfButtonTone[] = ['primary', 'secondary', 'danger', 'icon', 'icon-accent', 'icon-danger']
    for (const tone of tones) {
      expect(mapCfButtonTone(tone).variant).not.toBe('soft')
    }
  })
})

describe('cfButtonRootClass', () => {
  it('marks primary labeled buttons so CSS can paint solid accent', () => {
    const classes = cfButtonRootClass('primary', { showLabelInline: true })
    expect(classes).toContain('cf-btn')
    expect(classes).toContain('cf-btn--primary')
    expect(classes).toContain('cf-btn--lg')
    expect(classes).not.toContain('cf-btn--icon-only')
  })

  it('adds block class for full-width login/register', () => {
    expect(cfButtonRootClass('primary', { showLabelInline: true, block: true })).toContain('cf-btn--block')
  })

  it('compacts icon tones', () => {
    const classes = cfButtonRootClass('icon-danger', { showLabelInline: false })
    expect(classes).toContain('cf-btn--icon-only')
    expect(classes).not.toContain('cf-btn--lg')
  })
})
