import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import * as admin from 'firebase-admin'
import { ROLES_KEY } from './roles.decorator'
import { Request } from 'express'

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken & { role?: string }
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      console.log('Headers recibidos:', request.headers)
      console.log('Token extraído:', token)
      throw new UnauthorizedException(
        'No se ha proporcionado un token de autenticación',
      )
    }

    try {
      // 1. Verificar Token
      // Intentar primero como Session Cookie (nuestra nueva lógica en Astro SSR)
      let decodedToken: admin.auth.DecodedIdToken
      try {
        decodedToken = await admin.auth().verifySessionCookie(token, true)
      } catch {
        // Fallback: Si no es Session Cookie, intentar como IdToken clásico
        decodedToken = await admin.auth().verifyIdToken(token)
      }

      request.user = decodedToken

      // 2. Verificar Roles (si el endpoint tiene roles requeridos)
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      )

      if (!requiredRoles) {
        return true // No roles required, allow access
      }

      // Obtener el rol del usuario desde Firestore (claims custom o documento user)
      let userRole = (
        decodedToken as admin.auth.DecodedIdToken & { role?: string }
      ).role

      if (!userRole) {
        // Fallback: Consultar Firestore
        const userDoc = await admin
          .firestore()
          .collection('users')
          .doc(decodedToken.uid)
          .get()
        if (userDoc.exists) {
          const data = userDoc.data()
          userRole = data?.role as string | undefined
        }
      }

      // Attach role to user object in request so controllers can use it
      if (userRole && request.user) {
        request.user.role = userRole
      }

      if (!userRole || !requiredRoles.includes(userRole)) {
        throw new ForbiddenException(
          `Tu rol de usuario carece de permisos. Requerido: ${requiredRoles.join(
            ', ',
          )}`,
        )
      }

      return true
    } catch (error) {
      // Si ya es una ForbiddenException, dejarla pasar (no es un error de token)
      if (error instanceof ForbiddenException) {
        throw error
      }

      throw new UnauthorizedException('Token inválido o expirado')
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
