import * as admin from 'firebase-admin'

export interface ContactoRecord {
  contactoId: string
  name: string
  email: string
  empresa?: string
  industria?: string
  phone?: string
  origen: 'formulario_contacto' | 'formulario_diagnostico' | 'chatbot'
  createdAt: Date | admin.firestore.Timestamp
  updatedAt: Date | admin.firestore.Timestamp
  status: 'lead' | 'client' | 'inactive'
}

export interface RespuestaRecord {
  fecha: Date | admin.firestore.Timestamp
  contenido: string
  emailSent: boolean
}

export interface ConsultaRecord {
  consultaId: string
  asunto?: string
  fecha: Date | admin.firestore.Timestamp
  contenido: string
  estado:
    | 'respondida_automaticamente'
    | 'no_respondida'
    | 'respondida_manualmente'
  respuesta?: RespuestaRecord
  meta?: {
    userAgent: string
    referrer?: string | null
    page: string
    ts: string
  }
}

export interface DiagnosticoRecord {
  diagnosticoId: string
  respuestas: boolean[]
  estado: 'enviado' | 'no_enviado'
  contenido: any // JSON copy of the assessment result
  createdAt: Date | admin.firestore.Timestamp
}

export interface SubscriberRecord {
  subscriberId: string
  email: string
  meta: {
    userAgent: string
    referrer?: string | null
    page: string
    ts: string
  }
  createdAt: Date | admin.firestore.Timestamp
  updatedAt: Date | admin.firestore.Timestamp
  status: 'pending' | 'sent' | 'confirmed' | 'unconfirmed' | 'inactive' | 'unsubscribed'
  confirmationToken: string | null
  confirmedAt: Date | admin.firestore.Timestamp | null
  reconfirmationSentAt?: Date | admin.firestore.Timestamp
  inactivatedAt?: Date | admin.firestore.Timestamp
}
