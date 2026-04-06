import { vi } from 'vitest'

// Mock global de firebase-admin
vi.mock('firebase-admin', async () => {
  const actual = await vi.importActual('firebase-admin')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { mockFirebaseAdmin } = await import('./mocks/firebase-admin')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...actual,
    ...mockFirebaseAdmin,
  }
})
