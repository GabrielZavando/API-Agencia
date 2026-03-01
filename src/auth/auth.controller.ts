import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
  Logger,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  @Post('session')
  async createSession(@Body('idToken') idToken: string, @Res() res: Response) {
    if (!idToken) {
      throw new UnauthorizedException('ID Token is required');
    }

    // Set session expiration to 14 days (maximum allowed by Firebase).
    const expiresIn = 1000 * 60 * 60 * 24 * 14;

    try {
      // Verify the ID token first.
      const decodedIdToken = await admin.auth().verifyIdToken(idToken);

      // Create the session cookie. This will also verify the ID token in the process.
      // The session cookie will have the same claims as the ID token.
      const sessionCookie = await admin
        .auth()
        .createSessionCookie(idToken, { expiresIn });

      // Omitimos el Set-Cookie desde el backend porque la app de Astro lo va a manejar
      // desde el lado del cliente (para enviar el cookie proper en fetch requests directos en su middleware)

      this.logger.log(`Session cookie created for user: ${decodedIdToken.uid}`);

      return res.status(200).json({ sessionCookie });
    } catch (error) {
      this.logger.error('Failed to create session cookie', error);
      throw new UnauthorizedException('Invalid ID token');
    }
  }
}
