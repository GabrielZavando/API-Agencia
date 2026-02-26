import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { TemplateService } from '../templates/template.service';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UsersService {
  private collection: admin.firestore.CollectionReference;
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
    this.collection = admin.firestore().collection('users');
    this.initializeSMTP();
  }

  private initializeSMTP() {
    const smtpConfigPath = path.join(
      process.cwd(),
      'config',
      'smtp-config.json',
    );
    if (fs.existsSync(smtpConfigPath)) {
      try {
        const fileContent = fs.readFileSync(smtpConfigPath, 'utf8');
        const smtpConfig = JSON.parse(fileContent) as Record<
          string,
          string | number | boolean
        >;
        this.transporter = nodemailer.createTransport({
          host: smtpConfig.host as string,
          port: Number(smtpConfig.port),
          secure: Boolean(smtpConfig.secure),
          auth: {
            user: smtpConfig.user as string,
            pass: smtpConfig.pass as string,
          },
        });
      } catch {
        this.initializeSMTPFromEnv();
      }
    } else {
      this.initializeSMTPFromEnv();
    }
  }

  private initializeSMTPFromEnv() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private clean(v?: string): string {
    return (v ?? '')
      .toString()
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }

  async create(createUserDto: CreateUserDto) {
    const data = createUserDto as unknown as Record<string, unknown>;
    const email = data.email as string;
    const password = data.password as string | undefined;
    const displayName = data.displayName as string;
    const role = data.role as string | undefined;

    const assignedRole = role || 'client';
    const generatedPassword =
      password || Math.random().toString(36).slice(-8) + 'A1!';
    const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`;

    try {
      // 1. Crear usuario en Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password: generatedPassword,
        displayName,
        photoURL,
      });

      const uid = userRecord.uid;

      // 2. Setear Custom Claims
      await admin.auth().setCustomUserClaims(uid, { role: assignedRole });

      // 3. Guardar en Firestore
      await this.collection.doc(uid).set({
        uid,
        email,
        displayName,
        photoURL,
        role: assignedRole,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Enviar email de bienvenida
      await this.sendWelcomeEmail(
        email,
        displayName,
        generatedPassword,
        assignedRole,
      );

      return { uid, email, displayName, photoURL, role: assignedRole };
    } catch (error: unknown) {
      const err = error as Error & { code?: string };
      if (err.code === 'auth/email-already-exists') {
        throw new BadRequestException(
          'El correo electrónico ya está registrado.',
        );
      }
      throw new BadRequestException(`Error creando usuario: ${err.message}`);
    }
  }

  private async sendWelcomeEmail(
    email: string,
    name: string,
    pass: string,
    role: string,
  ) {
    try {
      // Usaremos un HTML directo en caso de no haber un template específico aún
      const websiteUrl =
        this.configService.get<string>('WEBSITE_URL') ||
        'https://gabrielzavando.cl';
      const companyName =
        this.configService.get<string>('COMPANY_NAME') || 'Agencia Digital';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #FF0080; padding-bottom: 10px;">
            ¡Bienvenido a ${companyName}!
          </h2>
          <p>Hola ${name},</p>
          <p>Se ha creado una cuenta para ti en nuestro sistema con el rol de <strong>${role}</strong>.</p>
          <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #FF0080;">
            <p style="margin-top: 0;"><strong>Tus credenciales de acceso:</strong></p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Contraseña:</strong> ${pass}</p>
          </div>
          <p>Puedes iniciar sesión en nuestro portal privado aquí:</p>
          <a href="${websiteUrl}/login" style="display: inline-block; background: #FF0080; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Acceder al Panel
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">Te recomendamos cambiar esta contraseña la primera vez que inicies sesión por mayor seguridad.</p>
        </div>
      `;

      const mailOptions = {
        from: `"${companyName}" <${this.configService.get<string>('SMTP_FROM_EMAIL') || this.configService.get<string>('SMTP_USER')}>`,
        to: email,
        subject: `Tus credenciales de acceso - ${companyName}`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Correo de bienvenida enviado a: ${email}`);
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
    }
  }

  async findAll() {
    const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => doc.data());
  }

  async findOne(uid: string) {
    const doc = await this.collection.doc(uid).get();
    if (!doc.exists) {
      throw new NotFoundException(`Usuario no encontrado.`);
    }
    return doc.data();
  }

  async updateProfile(
    uid: string,
    updateData: { displayName?: string; phone?: string },
  ) {
    const docRef = this.collection.doc(uid);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Usuario no encontrado.`);
    }

    const updates: Record<string, unknown> = {
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Actualizar también en Auth si cambia el nombre
    if (updateData.displayName) {
      await admin
        .auth()
        .updateUser(uid, { displayName: updateData.displayName });
    }

    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return updatedDoc.data();
  }

  async updateUser(uid: string, updateData: Record<string, unknown>) {
    const docRef = this.collection.doc(uid);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Usuario no encontrado.`);
    }

    const updates: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const authUpdates: Record<string, unknown> = {};

    if (updateData.displayName !== undefined) {
      authUpdates.displayName = updateData.displayName;
      updates.displayName = updateData.displayName;
    }
    if (updateData.email !== undefined) {
      authUpdates.email = updateData.email;
      updates.email = updateData.email;
    }
    if (updateData.password) {
      authUpdates.password = updateData.password;
    }

    if (Object.keys(authUpdates).length > 0) {
      try {
        await admin.auth().updateUser(uid, authUpdates);
      } catch (error: unknown) {
        throw new BadRequestException(
          `Error al actualizar usuario en Auth: ${(error as Error).message}`,
        );
      }
    }

    if (updateData.role !== undefined) {
      await admin.auth().setCustomUserClaims(uid, { role: updateData.role });
      updates.role = updateData.role;
    }

    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    return updatedDoc.data();
  }

  async setAdminRole(uid: string) {
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    await this.collection.doc(uid).update({ role: 'admin' });
    return { message: `User ${uid} is now admin` };
  }
}
