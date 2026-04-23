import { FirebaseService } from './firebase.service'
import { ConfigService } from '@nestjs/config'

// Mock de firebase-admin
vi.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: vi.fn(),
  credential: { cert: vi.fn() },
  firestore: vi.fn(() => mockDb),
}))

const mockDocRef = {
  id: 'mock-id',
  set: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
  collection: vi.fn(),
}

const mockCollectionRef = {
  doc: vi.fn(() => mockDocRef),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  add: vi.fn().mockResolvedValue(mockDocRef),
}

const mockDb = {
  collection: vi.fn(() => mockCollectionRef),
  collectionGroup: vi.fn(() => mockCollectionRef),
  settings: vi.fn(),
  batch: vi.fn(() => ({
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
}

const mockConfigService = {
  get: vi.fn((key: string) => {
    const config: Record<string, string> = {
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_PRIVATE_KEY: 'test-key',
      FIREBASE_CLIENT_EMAIL: 'test@test.iam.gserviceaccount.com',
    }
    return config[key]
  }),
}

describe('FirebaseService — Contactos', () => {
  let service: FirebaseService

  beforeEach(() => {
    vi.clearAllMocks()
    mockDocRef.collection = vi.fn(() => mockCollectionRef)
    service = new FirebaseService(mockConfigService as unknown as ConfigService)
    // Inyectar db mockeado directamente
    ;(service as unknown as any).db = mockDb
  })

  describe('findContactoByEmail', () => {
    it('debe retornar null si no encuentra contacto', async () => {
      // Arrange
      mockCollectionRef.get.mockResolvedValueOnce({ empty: true, docs: [] })

      // Act
      const result = await service.findContactoByEmail('test@example.com')

      // Assert
      expect(result).toBeNull()
      expect(mockDb.collection).toHaveBeenCalledWith('contactos')
    })

    it('debe retornar el contacto con contactoId si lo encuentra', async () => {
      // Arrange
      const mockData = {
        name: 'Juan',
        email: 'juan@test.com',
        origen: 'formulario_contacto',
      }
      mockCollectionRef.get.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'abc123', data: () => mockData }],
      })

      // Act
      const result = await service.findContactoByEmail('juan@test.com')

      // Assert
      expect(result).toEqual({ contactoId: 'abc123', ...mockData })
    })
  })

  describe('saveContacto', () => {
    it('debe crear un nuevo contacto si el email no existe', async () => {
      // Arrange
      mockCollectionRef.get.mockResolvedValueOnce({ empty: true, docs: [] }) // findContactoByEmail
      mockDocRef.id = 'new-id'

      // Act
      const id = await service.saveContacto({
        name: 'María',
        email: 'maria@test.com',
        origen: 'formulario_contacto',
      })

      // Assert
      expect(id).toBe('new-id')
      expect(mockDocRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'María',
          email: 'maria@test.com',
          status: 'lead',
        }),
      )
    })

    it('debe actualizar el contacto si el email ya existe', async () => {
      // Arrange
      mockCollectionRef.get.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'existing-id', data: () => ({ name: 'María' }) }],
      })

      // Act
      const id = await service.saveContacto({
        email: 'maria@test.com',
        phone: '+56912345678',
      })

      // Assert
      expect(id).toBe('existing-id')
      expect(mockDocRef.update).toHaveBeenCalled()
    })
  })

  describe('addConsultaToContacto', () => {
    it('debe crear una consulta en la subcolección del contacto', async () => {
      // Arrange
      const subCollRef = {
        doc: vi.fn(() => ({ ...mockDocRef, id: 'consulta-id' })),
      }
      mockDocRef.collection = vi.fn(() => subCollRef)

      // Act
      await service.addConsultaToContacto('contacto-abc', {
        contenido: 'Quiero un presupuesto',
        estado: 'no_respondida',
      })

      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('contactos')
      expect(mockDocRef.update).toHaveBeenCalledWith(
        expect.objectContaining({ updatedAt: expect.any(Date) }),
      )
    })
  })

  describe('addDiagnosticoToContacto', () => {
    it('debe crear un diagnóstico en la subcolección del contacto', async () => {
      // Arrange
      const subCollRef = {
        doc: vi.fn(() => ({ ...mockDocRef, id: 'diag-id' })),
      }
      mockDocRef.collection = vi.fn(() => subCollRef)

      // Act
      await service.addDiagnosticoToContacto('contacto-abc', {
        respuestas: [true, false, true],
        estado: 'no_enviado',
        contenido: { score: 7 },
      })

      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('contactos')
    })
  })
})
