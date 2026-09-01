import { describe, expect, it } from 'vitest'
import { buildApp } from '@/app'

describe('GET /health', () => {
  it('risponde ok', async () => {
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ ok: true })
  })
})
