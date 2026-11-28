import { describe, expect, it } from 'vitest'
import {
  isActiveExecutionStatus,
  isStaleActiveExecution,
  listStaleActiveExecutionIds,
} from './workflowExecStatus'

describe('workflowExecStatus', () => {
  it('detects active statuses', () => {
    expect(isActiveExecutionStatus('running')).toBe(true)
    expect(isActiveExecutionStatus('waiting')).toBe(true)
    expect(isActiveExecutionStatus('completed')).toBe(false)
    expect(isActiveExecutionStatus('cancelled')).toBe(false)
  })

  it('flags stale active runs after 10 minutes', () => {
    const now = Date.parse('2026-11-27T12:00:00Z')
    expect(isStaleActiveExecution({
      status: 'running',
      started_at: '2026-11-27T11:30:00Z',
    }, now)).toBe(true)
    expect(isStaleActiveExecution({
      status: 'running',
      started_at: '2026-11-27T11:55:00Z',
    }, now)).toBe(false)
    expect(isStaleActiveExecution({
      status: 'completed',
      started_at: '2026-11-27T10:00:00Z',
    }, now)).toBe(false)
  })

  it('lists stale active execution ids in order', () => {
    const now = Date.parse('2026-11-27T12:00:00Z')
    expect(listStaleActiveExecutionIds([
      { id: 'a', status: 'running', started_at: '2026-11-27T11:00:00Z' },
      { id: 'b', status: 'running', started_at: '2026-11-27T11:55:00Z' },
      { id: 'a', status: 'running', started_at: '2026-11-27T11:00:00Z' },
      { id: 'c', status: 'completed', started_at: '2026-11-27T10:00:00Z' },
    ], now)).toEqual(['a'])
  })
})
