import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import * as admin from 'firebase-admin'
import { FirebaseService } from '../firebase/firebase.service'
import { CreateUserDto } from './dto/create-user.dto'
import { ConfigService } from '@nestjs/config'
import { MailService } from '../mail/mail.service'
import { companyConfig } from '../config/company.config'
import { UserResponseDto } from './dto/user-response.dto'
import { UserRecord, UserUpdates } from './interfaces/user.interface'

interface MulterFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  buffer: Buffer
}

@Injectable()
export class UsersService {
  private collection: admin.firestore.CollectionReference<UserRecord>

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.collection = this.firebaseService
      .getDb()
      .collection('users') as admin.firestore.CollectionReference<UserRecord>
  }

  private validatePassword(password: string) {
    if (password.length < 8) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 8 caracteres.',
      )
    }
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'La contraseña debe tener al menos una letra mayúscula.',
      )
    }
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException(
        'La contraseña debe tener al menos una letra minúscula.',
      )
    }
    if (!/[0-9]/.test(password)) {
      throw new BadRequestException(
        'La contraseña debe tener al menos un número.',
      )
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new BadRequestException(
        'La contraseña debe tener al menos un carácter especial.',
      )
    }
  }

  private mapUserToDto(docData: UserRecord): UserResponseDto {
    return {
      id: docData.id || docData.uid,
      email: docData.email,
      displayName: docData.displayName,
      photoURL: docData.photoURL || '',
      role: docData.role,
      storageLimitBytes: docData.storageLimitBytes || 0,
      createdAt: docData.createdAt,
      updatedAt: docData.updatedAt,
    }
  }

  private async sendWelcomeEmail(
    email: string,
    name: string,
    pass: string,
    role: string,
  ) {
    try {
      const companyName = companyConfig.name
      await this.mailService.sendMail({
        to: email,
        subject: `Tus credenciales de acceso - ${companyName}`,
        templateName: 'user-welcome',
        templateVariables: {
          name,
          userEmail: email,
          password: pass,
          role,
        },
      })
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error)
    }
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, displayName, role } = createUserDto
    const assignedRole = role || 'client'

    if (password) this.validatePassword(password)

    const generatedPassword =
      password || Math.random().toString(36).slice(-8) + 'A1!'
    const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName,
    )}&background=random&color=fff`

    try {
      const userRecord = await admin.auth().createUser({
        email,
        password: generatedPassword,
        displayName,
        photoURL,
      })

      const uid = userRecord.uid
      await admin.auth().setCustomUserClaims(uid, { role: assignedRole })

      const DEFAULT_STORAGE_BYTES = 5 * 1024 * 1024 * 1024
      const ADMIN_STORAGE_BYTES = 30 * 1024 * 1024 * 1024
      const storageLimitBytes =
        assignedRole === 'admin' ? ADMIN_STORAGE_BYTES : DEFAULT_STORAGE_BYTES

      const userData: UserRecord = {
        uid,
        id: uid,
        email,
        displayName,
        photoURL,
        role: assignedRole,
        storageLimitBytes,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }

      await this.collection.doc(uid).set(userData)
      await this.sendWelcomeEmail(
        email,
        displayName,
        generatedPassword,
        assignedRole,
      )

      return this.mapUserToDto(userData)
    } catch (error: any) {
      const firebaseError = error as { code?: string; message?: string }
      if (firebaseError.code === 'auth/email-already-exists') {
        throw new BadRequestException(
          'El correo electrónico ya está registrado.',
        )
      }
      throw new BadRequestException(
        `Error creando usuario: ${firebaseError.message || 'Error desconocido'}`,
      )
    }
  }

  async findAll(): Promise<UserResponseDto[]> {
    const snapshot = await this.collection.orderBy('createdAt', 'desc').get()
    return snapshot.docs.map((doc) => this.mapUserToDto(doc.data()))
  }

  async findAdmins(): Promise<UserResponseDto[]> {
    const snapshot = await this.collection.where('role', '==', 'admin').get()
    return snapshot.docs.map((doc) => this.mapUserToDto(doc.data()))
  }

  async findOne(uid: string): Promise<UserResponseDto> {
    const doc = await this.collection.doc(uid).get()
    if (!doc.exists) {
      try {
        const userRecord = await admin.auth().getUser(uid)
        const userData: UserRecord = {
          uid: userRecord.uid,
          id: userRecord.uid,
          email: userRecord.email || '',
          displayName: userRecord.displayName || '',
          photoURL: userRecord.photoURL,
          role: (userRecord.customClaims?.role as string) || 'client',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }
        return this.mapUserToDto(userData)
      } catch {
        throw new NotFoundException(`Usuario no encontrado.`)
      }
    }
    const data = doc.data()
    if (!data) throw new NotFoundException('Datos de usuario no encontrados')
    return this.mapUserToDto(data)
  }

  async updateProfile(
    uid: string,
    updateData: { displayName?: string; phone?: string; description?: string },
    avatar?: MulterFile,
  ): Promise<UserResponseDto> {
    const docRef = this.collection.doc(uid)
    const doc = await docRef.get()
    let existingData = doc.exists ? doc.data() : null

    if (!existingData) {
      try {
        const user = await admin.auth().getUser(uid)
        existingData = {
          uid: user.uid,
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL,
          role: (user.customClaims?.role as string) || 'client',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }
      } catch {
        throw new NotFoundException(`Usuario no encontrado.`)
      }
    }

    if (!existingData) {
      throw new NotFoundException('No se pudo recuperar la información base')
    }

    let photoURL: string | undefined
    if (avatar) {
      if (avatar.size > 2 * 1024 * 1024) {
        throw new BadRequestException('La imagen no debe superar los 2MB.')
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowed.includes(avatar.mimetype)) {
        throw new BadRequestException('Formato de imagen no válido.')
      }

      const bucket = admin.storage().bucket()
      const ext = avatar.originalname.split('.').pop() || 'jpg'
      const path = `users_avatars/${uid}_${Date.now()}.${ext}`
      const file = bucket.file(path)
      await file.save(avatar.buffer, {
        metadata: { contentType: avatar.mimetype },
      })
      await file.makePublic()
      photoURL = `https://storage.googleapis.com/${bucket.name}/${path}`
    }

    const updates: UserUpdates = {
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    if (photoURL) updates.photoURL = photoURL

    const authUpdates: admin.auth.UpdateRequest = {}
    if (updateData.displayName) authUpdates.displayName = updateData.displayName
    if (photoURL) authUpdates.photoURL = photoURL

    if (Object.keys(authUpdates).length > 0) {
      await admin.auth().updateUser(uid, authUpdates)
    }

    await docRef.set({ ...existingData, ...updates }, { merge: true })
    return this.mapUserToDto({ ...existingData, ...updates })
  }

  async updateUser(
    uid: string,
    updateData: Record<string, unknown>,
  ): Promise<UserResponseDto> {
    const docRef = this.collection.doc(uid)
    const doc = await docRef.get()
    if (!doc.exists) throw new NotFoundException(`Usuario no encontrado.`)

    const updates: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    const authUpdates: admin.auth.UpdateRequest = {}

    if (updateData.displayName !== undefined) {
      authUpdates.displayName = updateData.displayName as string
      updates.displayName = updateData.displayName
    }
    if (updateData.email !== undefined) {
      authUpdates.email = updateData.email as string
      updates.email = updateData.email
    }
    if (updateData.password) {
      this.validatePassword(updateData.password as string)
      authUpdates.password = updateData.password as string
    }

    if (Object.keys(authUpdates).length > 0) {
      await admin
        .auth()
        .updateUser(uid, authUpdates)
        .catch((e: Error) => {
          throw new BadRequestException(`Error Auth: ${e.message}`)
        })
    }

    if (updateData.role !== undefined) {
      await admin.auth().setCustomUserClaims(uid, { role: updateData.role })
      updates.role = updateData.role
    }

    if (updateData.storageLimitBytes !== undefined) {
      const storageLimit = Number(updateData.storageLimitBytes)
      if (!isNaN(storageLimit) && storageLimit > 0) {
        updates.storageLimitBytes = storageLimit
      }
    }

    await docRef.update(updates)
    const updated = await docRef.get()
    const finalData = updated.data()
    if (!finalData) {
      throw new NotFoundException('Datos no encontrados tras update')
    }
    return this.mapUserToDto(finalData)
  }

  async setAdminRole(uid: string): Promise<{ message: string }> {
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' })
    await this.collection.doc(uid).update({ role: 'admin' })
    return { message: `User ${uid} is now admin` }
  }

  async remove(uid: string): Promise<{ message: string }> {
    await admin
      .auth()
      .deleteUser(uid)
      .catch((e) => console.error(e))
    await this.collection.doc(uid).delete()
    return { message: `Usuario ${uid} eliminado correctamente` }
  }
}
