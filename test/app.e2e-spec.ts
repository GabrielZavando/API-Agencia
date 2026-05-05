import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from './setup-e2e'

describe('AppController (e2e)', () => {
  it('/ (GET)', async () => {
    const response = await request(app.getHttpServer() as string)
      .get('/')
      .expect(200)

    expect(response.text).toBe('Hello World!')
  })
})
