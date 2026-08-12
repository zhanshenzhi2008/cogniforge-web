import { describe, it, expect } from 'vitest'
import { resolveApiBase, apiUrl } from '../apiBase'

describe('resolveApiBase', () => {
  it('treats empty and /api as same-origin', () => {
    expect(resolveApiBase('')).toBe('')
    expect(resolveApiBase('/api')).toBe('')
    expect(resolveApiBase('/api/v1')).toBe('')
    expect(resolveApiBase(null)).toBe('')
  })

  it('keeps local backend origin', () => {
    expect(resolveApiBase('http://localhost:8080')).toBe('http://localhost:8080')
    expect(resolveApiBase('http://localhost:8080/')).toBe('http://localhost:8080')
  })

  it('strips historical /api suffixes', () => {
    expect(resolveApiBase('http://localhost:8080/api')).toBe('http://localhost:8080')
    expect(resolveApiBase('http://localhost:8080/api/v1')).toBe('http://localhost:8080')
    expect(resolveApiBase('https://cogniforge.example.com/api')).toBe('https://cogniforge.example.com')
  })
})

describe('apiUrl', () => {
  it('builds same-origin path when base is empty', () => {
    expect(apiUrl('/api/v1/auth/login', '')).toBe('/api/v1/auth/login')
    expect(apiUrl('/api/v1/auth/login', '/api')).toBe('/api/v1/auth/login')
  })

  it('prefixes local origin', () => {
    expect(apiUrl('/api/v1/auth/login', 'http://localhost:8080')).toBe(
      'http://localhost:8080/api/v1/auth/login',
    )
  })
})
