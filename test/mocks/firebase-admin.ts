import { vi, type Mock } from 'vitest'

// Mock de DocumentReference
export const mockDoc: Mock = vi.fn(() => ({
  id: 'mock-id',
  set: mockSet,
  get: mockDocGet.mockResolvedValue({
    exists: true,
    id: 'mock-id',
    data: vi.fn().mockReturnValue({}),
  }),
  update: mockUpdate,
  delete: mockDelete,
  collection: vi.fn(() => ({
    get: mockCollectionGet.mockResolvedValue({
      size: 0,
      docs: [],
      forEach: vi.fn((cb: (doc: any) => void) => [].forEach(cb)),
    }),
    add: mockAdd,
  })),
}))

export const mockDocGet: Mock = vi.fn()
export const mockCollectionGet: Mock = vi.fn().mockResolvedValue({
  size: 0,
  docs: [],
  forEach: vi.fn((cb: (doc: any) => void) => [].forEach(cb)),
})
export const mockGet: Mock = mockDocGet // Alias por retrocompatibilidad
export const mockSet: Mock = vi.fn()
export const mockUpdate: Mock = vi.fn()
export const mockDelete: Mock = vi.fn()

// Mock de CollectionReference / Query
export const mockAdd: Mock = vi.fn()
export const mockWhere: Mock = vi.fn()
export const mockOrderBy: Mock = vi.fn()
export const mockLimit: Mock = vi.fn()
export const mockStartAfter: Mock = vi.fn()
export const mockOnSnapshot: Mock = vi.fn()

// Cadena de métodos para Query
const queryChain = {
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  startAfter: mockStartAfter,
  get: mockCollectionGet,
  onSnapshot: mockOnSnapshot,
}

// Configurar retornos por defecto para evitar errores de undefined
mockWhere.mockReturnValue(queryChain)
mockOrderBy.mockReturnValue(queryChain)
mockLimit.mockReturnValue(queryChain)
mockStartAfter.mockReturnValue(queryChain)

export const mockCollection: Mock = vi.fn(() => ({
  doc: mockDoc,
  add: mockAdd,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  startAfter: mockStartAfter,
  get: vi.fn().mockResolvedValue({
    size: 0,
    docs: [],
    forEach: vi.fn((cb: (doc: any) => void) => [].forEach(cb)),
  }),
}))

export const mockFirestore: any = {
  collection: mockCollection,
  doc: mockDoc,
  collectionGroup: vi.fn(() => ({
    where: mockWhere,
    get: vi.fn().mockResolvedValue({ docs: [] }),
  })),
}

// Mock principal de firebase-admin
// Clases estáticas de Firestore
export class MockTimestamp {
  constructor(
    public seconds: number,
    public nanoseconds: number,
  ) {}
  static now() {
    return new MockTimestamp(Math.floor(Date.now() / 1000), 0)
  }
  static fromDate(date: Date) {
    return new MockTimestamp(Math.floor(date.getTime() / 1000), 0)
  }
  toMillis() {
    return this.seconds * 1000
  }
  toDate() {
    return new Date(this.toMillis())
  }
}

export const mockFirestoreNamespace: any = {
  FieldValue: {
    serverTimestamp: vi.fn(() => 'mock-timestamp'),
    arrayUnion: vi.fn(),
    arrayRemove: vi.fn(),
    increment: vi.fn(),
    delete: vi.fn(() => 'field-delete'),
  },
  Timestamp: MockTimestamp,
}

export const mockAuth: any = {
  verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-uid' }),
  verifySessionCookie: vi.fn().mockResolvedValue({ uid: 'test-uid' }),
  getUser: vi.fn().mockResolvedValue({
    uid: 'test-uid',
    email: 'test@test.com',
  }),
  createUser: vi.fn().mockResolvedValue({ uid: 'new-uid' }),
  updateUser: vi.fn().mockResolvedValue({ uid: 'uid' }),
  deleteUser: vi.fn().mockResolvedValue(true),
  createSessionCookie: vi.fn().mockResolvedValue('session-cookie'),
}

export const mockFirebaseAdmin: any = {
  apps: [],
  initializeApp: vi.fn(),
  credential: {
    cert: vi.fn(),
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  firestore: Object.assign(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    vi.fn(() => mockFirestore),
    mockFirestoreNamespace,
  ),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  auth: Object.assign(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    vi.fn(() => mockAuth),
    mockAuth,
  ),
}

export default mockFirebaseAdmin
