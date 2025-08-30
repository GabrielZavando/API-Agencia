import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { ContactDto } from '../forms/dto/contact.dto';
import { SubscribeDto } from '../forms/dto/subscribe.dto';

export interface ProspectRecord {
  prospectId: string;  // ID interno del prospecto (Firestore)
  name: string;
  email: string;
  phone: string; // Siempre será un string (vacío o con teléfono)
  createdAt: Date;
  updatedAt: Date;
  conversations: ConversationRecord[];
  // Campo para cuando se convierta en usuario autenticado
  authUserId?: string;  // Firebase Auth UID (cuando se registre)
  status: 'prospect' | 'converted' | 'inactive';
}

export interface ConversationRecord {
  conversationId: string;
  incomingMessage: IncomingMessageRecord;
  outgoingResponse: OutgoingResponseRecord;
  timestamp: Date;
}

export interface IncomingMessageRecord {
  messageId: string;
  content: string;
  meta: {
    userAgent: string;
    referrer?: string | null;
    page: string;
    ts: string;
  };
  receivedAt: Date;
}

export interface OutgoingResponseRecord {
  responseId: string;
  content: string;
  sentAt: Date;
  emailSent: boolean;
}

@Injectable()
export class FirebaseService {
  private db: admin.firestore.Firestore;

  constructor(private configService: ConfigService) {
    // Inicializar Firebase Admin con credenciales del .env
    if (!admin.apps.length) {
      const serviceAccount = {
        projectId: this.configService.get('FIREBASE_PROJECT_ID'),
        privateKey: this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
      };

      // Validar que tenemos todas las credenciales necesarias
      if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
        throw new Error('Faltan credenciales de Firebase en las variables de entorno');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId,
      });

      console.log(`✅ Firebase inicializado para proyecto: ${serviceAccount.projectId}`);
    }

    this.db = admin.firestore();
    
    // Configurar settings de Firestore
    this.db.settings({
      timestampsInSnapshots: true,
    });
  }

  async findProspectByEmail(email: string): Promise<ProspectRecord | null> {
    try {
      const snapshot = await this.db
        .collection('prospects')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { prospectId: doc.id, ...doc.data() } as ProspectRecord;
    } catch (error) {
      console.error('Error buscando prospecto:', error);
      return null;
    }
  }

  async createProspectWithConversation(contactDto: ContactDto, responseContent: string): Promise<string> {
    try {
      // Generar IDs únicos
      const prospectId = this.db.collection('prospects').doc().id;
      const conversationId = this.db.collection('conversations').doc().id;
      const messageId = this.db.collection('messages').doc().id;
      const responseId = this.db.collection('responses').doc().id;
      const now = new Date();

      const conversation: ConversationRecord = {
        conversationId,
        incomingMessage: {
          messageId,
          content: contactDto.message,
          meta: contactDto.meta,
          receivedAt: now,
        },
        outgoingResponse: {
          responseId,
          content: responseContent,
          sentAt: now,
          emailSent: false, // Se actualizará después del envío
        },
        timestamp: now,
      };

      const prospectData: ProspectRecord = {
        prospectId,
        name: contactDto.name,
        email: contactDto.email,
        phone: contactDto.phone || '', // String vacío si no hay teléfono
        createdAt: now,
        updatedAt: now,
        status: 'prospect',
        conversations: [conversation],
      };

      await this.db.collection('prospects').doc(prospectId).set(prospectData);
      return prospectId;
    } catch (error) {
      console.error('Error creando prospecto:', error);
      throw new Error('Error creando prospecto en Firebase');
    }
  }

  async addConversationToProspect(
    prospectId: string,
    contactDto: ContactDto,
    responseContent: string,
  ): Promise<string> {
    try {
      // Generar IDs únicos
      const conversationId = this.db.collection('conversations').doc().id;
      const messageId = this.db.collection('messages').doc().id;
      const responseId = this.db.collection('responses').doc().id;
      const now = new Date();

      const newConversation: ConversationRecord = {
        conversationId,
        incomingMessage: {
          messageId,
          content: contactDto.message,
          meta: contactDto.meta,
          receivedAt: now,
        },
        outgoingResponse: {
          responseId,
          content: responseContent,
          sentAt: now,
          emailSent: false, // Se actualizará después del envío
        },
        timestamp: now,
      };

      await this.db
        .collection('prospects')
        .doc(prospectId)
        .update({
          updatedAt: now,
          conversations: admin.firestore.FieldValue.arrayUnion(newConversation),
        });

      return conversationId;
    } catch (error) {
      console.error('Error añadiendo conversación:', error);
      throw new Error('Error añadiendo conversación en Firebase');
    }
  }

  async markEmailAsSent(prospectId: string, conversationId: string): Promise<void> {
    try {
      // Obtener el prospecto
      const prospectDoc = await this.db.collection('prospects').doc(prospectId).get();
      
      if (!prospectDoc.exists) {
        throw new Error('Prospecto no encontrado');
      }

      const prospectData = prospectDoc.data() as ProspectRecord;
      
      // Actualizar el estado del email en la conversación específica
      const updatedConversations = prospectData.conversations.map(conv => {
        if (conv.conversationId === conversationId) {
          return {
            ...conv,
            outgoingResponse: {
              ...conv.outgoingResponse,
              emailSent: true,
            },
          };
        }
        return conv;
      });

      await this.db
        .collection('prospects')
        .doc(prospectId)
        .update({
          conversations: updatedConversations,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error marcando email como enviado:', error);
      throw new Error('Error actualizando estado del email');
    }
  }

  // Método para probar la conexión a Firebase
  async testConnection() {
    try {
      const testData = {
        message: 'Prueba de conexión a Firebase',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        projectId: this.configService.get('FIREBASE_PROJECT_ID'),
        testId: Math.random().toString(36).substring(7),
      };
      
      console.log('🔄 Probando conexión a Firebase...');
      
      // Crear documento de prueba
      const docRef = await this.db.collection('connection_tests').add(testData);
      console.log(`✅ Documento de prueba creado con ID: ${docRef.id}`);
      
      // Leer el documento creado
      const doc = await docRef.get();
      const docData = doc.data();
      console.log('📖 Datos leídos:', docData);
      
      // Eliminar el documento de prueba
      await docRef.delete();
      console.log('🗑️ Documento de prueba eliminado');
      
      return {
        success: true,
        message: 'Conexión a Firebase exitosa',
        projectId: this.configService.get('FIREBASE_PROJECT_ID'),
        documentId: docRef.id,
        data: docData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en prueba de Firebase:', error);
      throw new Error(`Error conectando a Firebase: ${error.message}`);
    }
  }

  // Guardar suscriptor en la colección 'subscribers'
  async saveSubscriber(subscribeDto: SubscribeDto): Promise<string> {
    try {
      // Comprobar si ya existe
      const existing = await this.findSubscriberByEmail(subscribeDto.email);
      if (existing) {
        // Si existe, no crear nuevo documento; retornar el id existente
        return existing.subscriberId;
      }

      const now = new Date();
      const docRef = this.db.collection('subscribers').doc();
      const data = {
        subscriberId: docRef.id,
        email: subscribeDto.email,
        meta: subscribeDto.meta,
        createdAt: now,
        updatedAt: now,
        status: 'active',
      } as const;

      await docRef.set(data);
      return docRef.id;
    } catch (error) {
      console.error('Error guardando suscriptor:', error);
      throw new Error('Error guardando suscriptor en Firebase');
    }
  }

  async findSubscriberByEmail(email: string): Promise<{ subscriberId: string; email: string } | null> {
    try {
      const snapshot = await this.db
        .collection('subscribers')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { subscriberId: doc.id, email: (doc.data() as any).email };
    } catch (error) {
      console.error('Error buscando suscriptor:', error);
      return null;
    }
  }
}
