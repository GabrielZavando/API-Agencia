import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
  type MockInstance,
} from 'vitest'
import request from 'supertest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, type ExecutionContext } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import {
  MAIL_PROVIDER,
  type IMailProvider,
  type MailSendPayload,
  type MailSendResult,
} from '../src/mail/interfaces/mail-provider.interface'
import { FirebaseAuthGuard } from '../src/auth/firebase-auth.guard'
import { FirebaseService } from '../src/firebase/firebase.service'
import type { AuthRequest } from '../src/common/interfaces/auth.interface'
import * as admin from 'firebase-admin'

// Importar el mock global de firebase-admin
import mockFirebaseAdmin from './mocks/firebase-admin'

// Mockear firebase-admin para que use nuestro mock en lugar de intentar conectar a emuladores
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
vi.mock('firebase-admin', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  default: mockFirebaseAdmin,
  ...mockFirebaseAdmin,
}))

describe('Email Flows (E2E Final)', () => {
  let app: INestApplication
  let resendProviderSpy: MockInstance<
    (payload: MailSendPayload) => Promise<MailSendResult>
  >

  beforeAll(async () => {
    process.env.RESEND_API_KEY = 're_test_key'

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext): boolean => {
          const req = context.switchToHttp().getRequest<AuthRequest>()
          // Cast controlado para el mock del token de Firebase
          req.user = {
            uid: 'test-admin',
            email: 'admin@webastro.cl',
            role: 'admin',
          } as unknown as admin.auth.DecodedIdToken
          return true
        },
      })
      .overrideProvider(FirebaseService)
      .useValue({
        saveContacto: vi.fn().mockResolvedValue('mock-contact-id'),
        saveDiagnostico: vi.fn().mockResolvedValue({ id: 'mock-diag' }),
        addDiagnosticoToContacto: vi.fn().mockResolvedValue({}),
        addConsultaToContacto: vi.fn().mockResolvedValue({}),
        createSupportTicket: vi.fn().mockResolvedValue({
          id: 'mock-ticket',
          get: () => ({ exists: true, data: () => ({}) }),
        }),
        getSupportTicket: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            clientEmail: 'test@example.com',
            subject: 'Consulta',
          }),
        }),
        updateSupportTicket: vi.fn().mockResolvedValue({}),
        addSupportMessage: vi.fn().mockResolvedValue({ id: 'mock-msg' }),
        getDb: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnThis(),
          collectionGroup: vi.fn().mockReturnThis(),
          doc: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          count: vi.fn().mockReturnThis(),
          set: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({}),
          get: vi.fn().mockResolvedValue({
            docs: [],
            size: 0,
            data: () => 0,
            forEach: vi.fn(),
          }),
        }),
        db: {
          collection: vi.fn().mockReturnThis(),
          collectionGroup: vi.fn().mockReturnThis(),
          doc: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          count: vi.fn().mockReturnThis(),
          add: vi.fn().mockResolvedValue({ id: 'mock-id' }),
          set: vi.fn().mockResolvedValue({}),
          get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
        },
      })
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    const resendProvider = app.get<IMailProvider>(MAIL_PROVIDER)
    resendProviderSpy = vi.spyOn(resendProvider, 'send')
  }, 90000)

  afterAll(async () => {
    if (app) await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    resendProviderSpy.mockResolvedValue({
      success: true,
      messageId: 'mock-resend',
    })
  })

  describe('Diagnóstico Digital', () => {
    it('debe enviar un email con PDF adjunto al completar el diagnóstico', async () => {
      const payload = {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        company: 'Empresa Test S.A.',
        industry: 'Tecnología',
        answers: Array(15).fill(true),
        turnstileToken: 'dummy-token',
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .post('/diagnostico')
        .send(payload)

      expect([200, 201]).toContain(response.status)
      expect(resendProviderSpy).toHaveBeenCalled()

      const callArgs: MailSendPayload = resendProviderSpy.mock.calls[0]?.[0]
      if (callArgs) {
        const to = Array.isArray(callArgs.to) ? callArgs.to[0] : callArgs.to
        expect(to).toBe('juan@example.com')
        expect(callArgs.attachments).toHaveLength(1)
        if (callArgs.attachments) {
          expect(callArgs.attachments[0]?.filename).toBe(
            'diagnostico-digital.pdf',
          )
        }
      }
    }, 30000)
  })

  describe('Registro de Usuarios', () => {
    it('debe enviar email de bienvenida al registrar un nuevo usuario', async () => {
      const payload = {
        email: `nuevo-${Math.random().toString(36).substring(7)}@example.com`,
        displayName: 'Nuevo Usuario',
        password: 'Password123!',
        role: 'client' as const,
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .post('/users/register')
        .send(payload)

      expect([200, 201]).toContain(response.status)
      expect(resendProviderSpy).toHaveBeenCalled()

      const welcomeCall = resendProviderSpy.mock.calls.find((c) => {
        const args: MailSendPayload = c[0]
        const to = Array.isArray(args.to) ? args.to[0] : args.to
        return to === payload.email
      })

      const callArgs: MailSendPayload | undefined = welcomeCall?.[0]
      expect(callArgs).toBeDefined()
      if (callArgs) {
        expect(callArgs.subject).toContain('Tus credenciales de acceso')
      }
    })
  })
})
