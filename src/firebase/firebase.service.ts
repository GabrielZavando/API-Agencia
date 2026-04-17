import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as admin from 'firebase-admin'
import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'
import { SubscribeDto } from '../forms/dto/subscribe.dto'
import {
  ContactoRecord,
  SubscriberRecord,
  ConsultaRecord,
  DiagnosticoRecord,
} from '../forms/interfaces/forms.interface'
import { SystemConfig } from '../system-config/interfaces/system-config.interface'

@Injectable()
export class FirebaseService {
  private db: admin.firestore.Firestore

  constructor(private configService: ConfigService) {
    this.initializeFirebase()
  }

  private initializeFirebase() {
    // Inicializar Firebase Admin con archivo JSON o variables de entorno
    if (!admin.apps.length) {
      try {
        let serviceAccount: Record<string, string>

        // Opción 1: archivo JSON local (desarrollo)
        const serviceAccountPath = path.join(
          process.cwd(),
          'config',
          'firebase-service-account.json',
        )

        if (fs.existsSync(serviceAccountPath)) {
          const fileContent = fs.readFileSync(serviceAccountPath, 'utf8')
          serviceAccount = JSON.parse(fileContent) as Record<string, string>
          console.log(
            '✅ Firebase inicializado con archivo JSON local para proyecto:',
            serviceAccount.project_id,
          )

          // Opción 2: variable de entorno FIREBASE_SERVICE_ACCOUNT (JSON entero)
        } else if (this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT')) {
          const json = this.configService.get<string>(
            'FIREBASE_SERVICE_ACCOUNT',
          )!
          serviceAccount = JSON.parse(json) as Record<string, string>
          console.log(
            '✅ Firebase inicializado con FIREBASE_SERVICE_ACCOUNT para proyecto:',
            serviceAccount.project_id,
          )
          // Opción 3: Variables individuales por entorno (Docker/env)
        } else if (
          this.configService.get<string>('FIREBASE_PROJECT_ID') &&
          this.configService.get<string>('FIREBASE_PRIVATE_KEY') &&
          this.configService.get<string>('FIREBASE_CLIENT_EMAIL')
        ) {
          serviceAccount = {
            project_id: this.configService.get<string>('FIREBASE_PROJECT_ID')!,
            // Docker env_file no parsea los retornos de línea adecuadamente a veces
            private_key: this.configService
              .get<string>('FIREBASE_PRIVATE_KEY')!
              .replace(/\\n/g, '\n')
              .replace(/"/g, ''),
            client_email: this.configService.get<string>(
              'FIREBASE_CLIENT_EMAIL',
            )!,
          }
          console.log(
            '✅ Firebase inicializado con variables individuales para proyecto:',
            serviceAccount.project_id,
          )
        } else {
          throw new Error(
            'Faltan credenciales de Firebase en las variables de entorno',
          )
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
          storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
        })
      } catch (error) {
        console.error('Error inicializando Firebase:', error)
        throw new Error('No se pudieron cargar las credenciales de Firebase')
      }
    }

    this.db = admin.firestore()

    // Configurar settings de Firestore
    this.db.settings({
      timestampsInSnapshots: true,
    })
  }

  public getDb(): admin.firestore.Firestore {
    return this.db
  }

  async findContactoByEmail(email: string): Promise<ContactoRecord | null> {
    try {
      const snapshot = await this.db
        .collection('contactos')
        .where('email', '==', email)
        .limit(1)
        .get()

      if (snapshot.empty) return null

      const doc = snapshot.docs[0]
      const data = doc.data() as Record<string, unknown>
      return { ...data, contactoId: doc.id } as unknown as ContactoRecord
    } catch (error) {
      console.error('Error buscando contacto:', error)
      return null
    }
  }

  async getAllContactos(): Promise<ContactoRecord[]> {
    try {
      const snapshot = await this.db
        .collection('contactos')
        .orderBy('updatedAt', 'desc')
        .get()

      return snapshot.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>
        return { ...data, contactoId: doc.id } as unknown as ContactoRecord
      })
    } catch (error) {
      console.error('Error obteniendo todos los contactos:', error)
      throw new Error('Error al obtener los contactos de Firebase')
    }
  }

  async getContactoById(contactoId: string): Promise<ContactoRecord | null> {
    try {
      const doc = await this.db.collection('contactos').doc(contactoId).get()
      if (!doc.exists) return null
      const data = doc.data() as Record<string, unknown>
      return { ...data, contactoId: doc.id } as unknown as ContactoRecord
    } catch (error) {
      console.error('Error obteniendo contacto por ID:', error)
      return null
    }
  }

  async saveContacto(data: Partial<ContactoRecord>): Promise<string> {
    try {
      let contactoId = data.contactoId
      const now = new Date()

      if (!contactoId && data.email) {
        const existing = await this.findContactoByEmail(data.email)
        if (existing) {
          contactoId = existing.contactoId
        }
      }

      if (!contactoId) {
        contactoId = this.db.collection('contactos').doc().id
        await this.db
          .collection('contactos')
          .doc(contactoId)
          .set({
            ...data,
            createdAt: now,
            updatedAt: now,
            status: 'lead',
          })
      } else {
        await this.db
          .collection('contactos')
          .doc(contactoId)
          .update({
            ...data,
            updatedAt: now,
          })
      }

      return contactoId
    } catch (error) {
      console.error('Error guardando contacto:', error)
      throw new Error('Error guardando contacto en Firebase')
    }
  }

  async addConsultaToContacto(
    contactoId: string,
    consultaData: Partial<ConsultaRecord>,
  ): Promise<string> {
    try {
      const consultaId = this.db
        .collection('contactos')
        .doc(contactoId)
        .collection('consultas')
        .doc().id
      const now = new Date()

      await this.db
        .collection('contactos')
        .doc(contactoId)
        .collection('consultas')
        .doc(consultaId)
        .set({
          consultaId,
          ...consultaData,
          fecha: now,
        })

      await this.db.collection('contactos').doc(contactoId).update({
        updatedAt: now,
      })

      return consultaId
    } catch (error) {
      console.error('Error añadiendo consulta:', error)
      throw new Error('Error añadiendo consulta en Firebase')
    }
  }

  async addDiagnosticoToContacto(
    contactoId: string,
    diagnosticoData: Partial<DiagnosticoRecord>,
  ): Promise<string> {
    try {
      const diagnosticoId = this.db
        .collection('contactos')
        .doc(contactoId)
        .collection('diagnosticos')
        .doc().id
      const now = new Date()

      await this.db
        .collection('contactos')
        .doc(contactoId)
        .collection('diagnosticos')
        .doc(diagnosticoId)
        .set({
          diagnosticoId,
          ...diagnosticoData,
          createdAt: now,
        })

      await this.db.collection('contactos').doc(contactoId).update({
        updatedAt: now,
      })

      return diagnosticoId
    } catch (error) {
      console.error('Error añadiendo diagnostico:', error)
      throw new Error('Error añadiendo diagnostico en Firebase')
    }
  }

  async addAdminReplyToConsulta(
    contactoId: string,
    consultaId: string,
    replyContent: string,
  ): Promise<void> {
    try {
      const now = new Date()
      await this.db
        .collection('contactos')
        .doc(contactoId)
        .collection('consultas')
        .doc(consultaId)
        .update({
          estado: 'respondida_manualmente',
          respuesta: {
            fecha: now,
            contenido: replyContent,
            emailSent: false,
          },
        })
      await this.db
        .collection('contactos')
        .doc(contactoId)
        .update({ updatedAt: now })
    } catch (error) {
      console.error('Error añadiendo respuesta administrativa:', error)
      throw new Error('Error añadiendo respuesta en Firebase')
    }
  }

  async markConsultaEmailAsSent(
    contactoId: string,
    consultaId: string,
  ): Promise<void> {
    try {
      // Necesitamos asegurar que no sobresscribimos todo el objeto respuesta
      await this.db
        .collection('contactos')
        .doc(contactoId)
        .collection('consultas')
        .doc(consultaId)
        .update({
          'respuesta.emailSent': true,
        })
    } catch (error) {
      console.error('Error marcando email como enviado:', error)
      throw new Error('Error actualizando estado del email')
    }
  }

  async getConsultasForContacto(contactoId: string): Promise<ConsultaRecord[]> {
    try {
      const snapshot = await this.db
        .collection('contactos')
        .doc(contactoId)
        .collection('consultas')
        .orderBy('fecha', 'desc')
        .get()

      return snapshot.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>
        return { ...data, consultaId: doc.id } as unknown as ConsultaRecord
      })
    } catch (error) {
      console.error('Error obteniendo consultas del contacto:', error)
      return []
    }
  }

  async getDiagnosticosForContacto(
    contactoId: string,
  ): Promise<DiagnosticoRecord[]> {
    try {
      const snapshot = await this.db
        .collection('contactos')
        .doc(contactoId)
        .collection('diagnosticos')
        .orderBy('createdAt', 'desc')
        .get()

      return snapshot.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>
        return {
          ...data,
          diagnosticoId: doc.id,
        } as unknown as DiagnosticoRecord
      })
    } catch (error) {
      console.error('Error obteniendo diagnósticos del contacto:', error)
      return []
    }
  }

  // Método para probar la conexión a Firebase
  async testConnection() {
    try {
      const testData = {
        message: 'Prueba de conexión a Firebase',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        testId: Math.random().toString(36).substring(7),
      }

      console.log('🔄 Probando conexión a Firebase...')

      // Crear documento de prueba
      const docRef = await this.db.collection('connection_tests').add(testData)
      console.log(`✅ Documento de prueba creado con ID: ${docRef.id}`)

      // Leer el documento creado
      const doc = await docRef.get()
      const docData = doc.data() as Record<string, unknown>
      console.log('📖 Datos leídos:', docData)

      // Eliminar el documento de prueba
      await docRef.delete()
      console.log('🗑️ Documento de prueba eliminado')

      return {
        success: true,
        message: 'Conexión a Firebase exitosa',
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        documentId: docRef.id,
        data: docData,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('❌ Error en prueba de Firebase:', error)
      throw new Error(
        `Error conectando a Firebase: ${(error as Error).message}`,
      )
    }
  }

  // Guardar suscriptor en la colección 'subscribers'
  async saveSubscriber(subscribeDto: SubscribeDto): Promise<string> {
    try {
      // Comprobar si ya existe
      const existing = await this.findSubscriberByEmail(subscribeDto.email)
      if (existing) {
        // Si existe (sea pending o confirmed), retornar el id existente
        return existing.subscriberId
      }

      const now = new Date()
      const docRef = this.db.collection('subscribers').doc()
      // Generar token único para Double Opt-In (64 chars hex)
      const confirmationToken = crypto.randomBytes(32).toString('hex')

      const data = {
        subscriberId: docRef.id,
        email: subscribeDto.email,
        meta: subscribeDto.meta,
        createdAt: now,
        updatedAt: now,
        status: 'pending', // Pendiente de confirmación via email
        confirmationToken,
        confirmedAt: null,
      }

      await docRef.set(data)
      return docRef.id
    } catch (error) {
      console.error('Error guardando suscriptor:', error)
      throw new Error('Error guardando suscriptor en Firebase')
    }
  }

  async findSubscriberByEmail(
    email: string,
  ): Promise<{ subscriberId: string; email: string } | null> {
    try {
      const snapshot = await this.db
        .collection('subscribers')
        .where('email', '==', email)
        .limit(1)
        .get()

      if (snapshot.empty) return null
      const doc = snapshot.docs[0]
      return {
        subscriberId: doc.id,
        email: (doc.data() as Record<string, unknown>).email as string,
      }
    } catch (error) {
      console.error('Error buscando suscriptor:', error)
      return null
    }
  }

  async getAllSubscribers(): Promise<SubscriberRecord[]> {
    try {
      const snapshot = await this.db
        .collection('subscribers')
        .orderBy('createdAt', 'desc')
        .get()

      return snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<SubscriberRecord, 'subscriberId'>
        return {
          subscriberId: doc.id,
          ...data,
        }
      })
    } catch (error) {
      console.error('Error obteniendo todos los suscriptores:', error)
      throw new Error('Error al obtener los suscriptores de Firebase')
    }
  }

  // Eliminar suscriptor de la colección 'subscribers' por EMAIL
  async removeSubscriber(email: string): Promise<boolean> {
    try {
      const subscriber = await this.findSubscriberByEmail(email)
      if (!subscriber) {
        return false // Suscriptor no encontrado
      }

      await this.db
        .collection('subscribers')
        .doc(subscriber.subscriberId)
        .delete()
      console.log(`\uD83D\uDDD1\uFE0F Suscriptor eliminado: ${email}`)
      return true
    } catch (error) {
      console.error('Error eliminando suscriptor:', error)
      throw new Error('Error eliminando suscriptor de Firebase')
    }
  }

  // Eliminar suscriptor por ID (Físico)
  async deleteSubscriberById(subscriberId: string): Promise<boolean> {
    try {
      await this.db.collection('subscribers').doc(subscriberId).delete()
      return true
    } catch (error) {
      console.error('Error eliminando suscriptor por ID:', error)
      return false
    }
  }

  // Eliminar múltiples suscriptores por ID (Físico, usando Batch)
  async bulkDeleteSubscribers(subscriberIds: string[]): Promise<number> {
    try {
      const batch = this.db.batch()
      subscriberIds.forEach((id) => {
        const docRef = this.db.collection('subscribers').doc(id)
        batch.delete(docRef)
      })
      await batch.commit()
      return subscriberIds.length
    } catch (error) {
      console.error('Error en eliminación masiva:', error)
      throw new Error('Fallo al realizar la eliminación masiva')
    }
  }

  // Double Opt-In: obtener token de confirmación por ID de suscriptor
  async getSubscriberConfirmationToken(
    subscriberId: string,
  ): Promise<string | null> {
    try {
      const doc = await this.db
        .collection('subscribers')
        .doc(subscriberId)
        .get()
      if (!doc.exists) return null
      const data = doc.data() as Record<string, unknown>
      return (data.confirmationToken as string) ?? null
    } catch (error) {
      console.error('Error obteniendo token de confirmación:', error)
      return null
    }
  }

  // Double Opt-In: confirmar suscripción por token
  async confirmSubscriber(
    token: string,
  ): Promise<{ success: boolean; email?: string }> {
    try {
      // Acepta tokens tanto en estado 'pending' (nueva suscripción) como 'sent' (campaña enviada)
      const snapshot = await this.db
        .collection('subscribers')
        .where('confirmationToken', '==', token)
        .limit(1)
        .get()

      if (!snapshot.empty) {
        const s = snapshot.docs[0].data() as Record<string, unknown>
        const allowedStatuses = ['pending', 'sent']
        if (!allowedStatuses.includes(s['status'] as string)) {
          return { success: false }
        }
      }

      if (snapshot.empty) {
        return { success: false }
      }

      const doc = snapshot.docs[0]
      const data = doc.data() as Record<string, unknown>
      const now = new Date()

      await doc.ref.update({
        status: 'confirmed',
        confirmedAt: now,
        updatedAt: now,
        confirmationToken: null, // Invalidar token ya usado
      })

      console.log(`\u2705 Suscriptor confirmado: ${data['email'] as string}`)
      return { success: true, email: data['email'] as string }
    } catch (error) {
      console.error('Error confirmando suscriptor:', error)
      return { success: false }
    }
  }

  // Campaña: genera un nuevo token de re-confirmación y registra la fecha
  async refreshReconfirmationToken(
    subscriberId: string,
  ): Promise<string | null> {
    try {
      const crypto = await import('crypto')
      const newToken = crypto.randomBytes(32).toString('hex')
      const now = new Date()

      await this.db.collection('subscribers').doc(subscriberId).update({
        confirmationToken: newToken,
        status: 'sent', // Indica que el correo de confirmación fue enviado
        reconfirmationSentAt: now,
        updatedAt: now,
      })

      return newToken
    } catch (error) {
      console.error('Error generando token de re-confirmación:', error)
      return null
    }
  }

  // Campaña: marcar suscriptor como inactivo (no confirmó en el plazo)
  async markSubscriberInactive(subscriberId: string): Promise<void> {
    await this.db.collection('subscribers').doc(subscriberId).update({
      status: 'inactive',
      inactivatedAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Campaña: marcar como 'unconfirmed' a los que no confirmaron en el plazo (72h)
  async markSubscribersUnconfirmed(hoursThreshold = 72): Promise<number> {
    const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000)
    const snapshot = await this.db
      .collection('subscribers')
      .where('status', '==', 'sent')
      .get()

    const batch = this.db.batch()
    let count = 0
    const now = new Date()

    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, unknown>
      const sentAt = data['reconfirmationSentAt'] as admin.firestore.Timestamp | Date | undefined
      if (!sentAt) continue

      const sentDate = sentAt instanceof Date ? sentAt : sentAt.toDate()
      if (sentDate < cutoff) {
        batch.update(doc.ref, {
          status: 'unconfirmed',
          unconfirmedAt: now,
          updatedAt: now,
        })
        count++
      }
    }

    if (count > 0) await batch.commit()
    return count
  }

  // --- CONFIGURACIÓN DEL SISTEMA ---

  async getSystemConfig(): Promise<SystemConfig | null> {
    try {
      const doc = await this.db.collection('system_config').doc('global').get()
      if (!doc.exists) return null
      return doc.data() as SystemConfig
    } catch (error) {
      console.error('Error obteniendo system_config:', error)
      return null
    }
  }

  async updateSystemConfig(data: Partial<SystemConfig>): Promise<void> {
    try {
      await this.db
        .collection('system_config')
        .doc('global')
        .set(
          {
            ...data,
            updatedAt: new Date(),
          },
          { merge: true },
        )
    } catch (error) {
      console.error('Error actualizando system_config:', error)
      throw new Error('Error al actualizar la configuración de Firebase')
    }
  }
}
