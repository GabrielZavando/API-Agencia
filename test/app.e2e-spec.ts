import { describe, it, expect } from 'vitest';
import * as request from 'supertest';
import { app } from './setup-e2e';

describe('AppController (e2e)', () => {
  it('/ (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .expect(200);
    
    expect(response.text).toBe('Hello World!');
  });
});
