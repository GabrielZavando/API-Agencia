import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  private collection: admin.firestore.CollectionReference;

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.collection = admin.firestore().collection('users');
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

      await this.mailService.sendMail({
        to: email,
        subject: `Tus credenciales de acceso - ${companyName}`,
        html: htmlContent,
      });
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
    updateData: { displayName?: string; phone?: string; description?: string },
    avatar?: Express.Multer.File,
  ) {
    const docRef = this.collection.doc(uid);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Usuario no encontrado.`);
    }

    let photoURL: string | undefined = undefined;

    // Procesar Avatar si existe
    if (avatar) {
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB
      const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

      if (avatar.size > MAX_SIZE) {
        throw new BadRequestException(
          'La imagen de perfil no debe superar los 2MB.',
        );
      }
      if (!ALLOWED_MIME.includes(avatar.mimetype)) {
        throw new BadRequestException(
          'Formato de imagen no válido. Usa JPG, PNG o WEBP.',
        );
      }

      const bucket = admin.storage().bucket();
      const ext = avatar.originalname.split('.').pop() || 'jpg';
      const storagePath = `users_avatars/${uid}_${Date.now()}.${ext}`;
      const fileRef = bucket.file(storagePath);

      await fileRef.save(avatar.buffer, {
        metadata: { contentType: avatar.mimetype },
      });

      // Hacer que la URL sea pública nativamente (Firebase Cloud Storage URL public)
      await fileRef.makePublic();
      photoURL = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    }

    const updates: Record<string, unknown> = {
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (photoURL) {
      updates.photoURL = photoURL;
    }

    // Actualizar también en Auth si cambia el nombre o la foto
    const authUpdates: admin.auth.UpdateRequest = {};
    if (updateData.displayName)
      authUpdates.displayName = updateData.displayName;
    if (photoURL) authUpdates.photoURL = photoURL;

    if (Object.keys(authUpdates).length > 0) {
      await admin.auth().updateUser(uid, authUpdates);
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

    // Parse and save new limits
    if (updateData.storageLimitGb !== undefined) {
      const storageLimit = Number(updateData.storageLimitGb);
      if (!isNaN(storageLimit)) {
        updates.storageLimitGb = storageLimit;
      }
    }
    if (updateData.monthlyTicketLimit !== undefined) {
      const ticketLimit = Number(updateData.monthlyTicketLimit);
      if (!isNaN(ticketLimit)) {
        updates.monthlyTicketLimit = ticketLimit;
      }
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
