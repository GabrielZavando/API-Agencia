import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { FirebaseAuthGuard } from './firebase-auth.guard'
import { Reflector } from '@nestjs/core'
import {
  UnauthorizedException,
  ForbiddenException,
  ExecutionContext,
} from '@nestjs/common'
import * as admin from 'firebase-admin'

// Importar mocks centralizados
import { mockAuth } from '../../test/mocks/firebase-admin'

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard
  let reflector: Reflector

  beforeEach(async () => {
    vi.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: vi.fn(),
          },
        },
      ],
    }).compile()

    guard = module.get<FirebaseAuthGuard>(FirebaseAuthGuard)
    reflector = module.get<Reflector>(Reflector)
  })

  const mockExecutionContext = (authHeader?: string, cookieHeader?: string) => {
    const req = {
      headers: {
        authorization: authHeader,
        cookie: cookieHeader,
      },
      user: null,
    }

    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext
  }

  it('debe estar definido', () => {
    expect(guard).toBeDefined()
  })

  it('debe lanzar UnauthorizedException si no hay token', async () => {
    const context = mockExecutionContext()
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('debe validar un token de sesión (Astro Cookie) correctamente', async () => {
    const context = mockExecutionContext(undefined, 'session=valid-cookie')
    const decodedToken = { uid: 'user-123' }

    mockAuth.verifySessionCookie.mockResolvedValue(decodedToken)
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    expect(context.switchToHttp().getRequest().user).toEqual(decodedToken)
  })

  it('debe validar un IdToken clásico si falla la Session Cookie', async () => {
    const context = mockExecutionContext('Bearer valid-id-token')
    const decodedToken = { uid: 'user-id-token' }

    mockAuth.verifySessionCookie.mockRejectedValue(new Error('No es cookie'))
    mockAuth.verifyIdToken.mockResolvedValue(decodedToken)
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)

    const result = await guard.canActivate(context)

    expect(result).toBe(true)
    const req = context.switchToHttp().getRequest()
    expect(req.user).toEqual(decodedToken)
  })

  it('debe verificar roles exitosamente', async () => {
    const context = mockExecutionContext('Bearer valid-token')
    const decodedToken = { uid: 'user-123', role: 'admin' }

    mockAuth.verifySessionCookie.mockResolvedValue(decodedToken)
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin'])

    const result = await guard.canActivate(context)
    expect(result).toBe(true)
  })

  it('debe lanzar ForbiddenException si el rol no coincide', async () => {
    const context = mockExecutionContext('Bearer valid-token')
    const decodedToken = { uid: 'user-123', role: 'user' }

    mockAuth.verifySessionCookie.mockResolvedValue(decodedToken)
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin'])

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException)
  })

  it('debe consultar Firestore si el token no tiene el rol embebido', async () => {
    const context = mockExecutionContext('Bearer valid-token')
    const decodedToken = { uid: 'user-123' } // No role here

    mockAuth.verifySessionCookie.mockResolvedValue(decodedToken)
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin'])

    // Forzar el mock de admin.firestore() directamente en el test
    const mockDb = {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: 'admin' }),
      }),
    }
    vi.spyOn(admin, 'firestore').mockReturnValue(
      mockDb as unknown as admin.firestore.Firestore,
    )

    const result = await guard.canActivate(context)
    expect(result).toBe(true)
    const req = context.switchToHttp().getRequest()
    expect(req.user.role).toBe('admin')
  })
})
