import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as admin from 'firebase-admin';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // 1. Verificar Token
      const decodedToken = await admin.auth().verifyIdToken(token);
      request['user'] = decodedToken;

      // 2. Verificar Roles (si el endpoint tiene roles requeridos)
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!requiredRoles) {
        return true; // No roles required, allow access
      }

      // Obtener el rol del usuario desde Firestore (claims custom o documento user)
      // Por simplicidad y performance, idealmente usar Custom Claims.
      // Si no hay claims, consultamos Firestore (más lento pero más fácil de implementar inicialmente)

      let userRole = (decodedToken as any).role; // Si usamos custom claims

      if (!userRole) {
        // Fallback: Consultar Firestore
        const userDoc = await admin
          .firestore()
          .collection('users')
          .doc(decodedToken.uid)
          .get();
        if (userDoc.exists) {
          userRole = userDoc.data()?.role;
        }
      }

      // Attach role to user object in request so controllers can use it
      if (userRole) {
        request['user'].role = userRole;
      }

      if (!requiredRoles.includes(userRole)) {
        throw new ForbiddenException(
          `User role '${userRole}' does not have permission. Required: ${requiredRoles.join(
            ', ',
          )}`,
        );
      }

      return true;
    } catch (error) {
      console.error('Auth Error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
