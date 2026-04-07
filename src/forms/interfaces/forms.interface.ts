import * as admin from 'firebase-admin'

export interface ProspectRecord {
  prospectId: string
  name: string
  email: string
  phone: string
  createdAt: Date | admin.firestore.Timestamp
  updatedAt: Date | admin.firestore.Timestamp
  conversations: ConversationRecord[]
  authUserId?: string
  status: 'prospect' | 'converted' | 'inactive'
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
  status: 'pending' | 'confirmed' | 'inactive' | 'unsubscribed'
  confirmationToken: string | null
  confirmedAt: Date | admin.firestore.Timestamp | null
  reconfirmationSentAt?: Date | admin.firestore.Timestamp
  inactivatedAt?: Date | admin.firestore.Timestamp
}

export interface ConversationRecord {
  conversationId: string
  incomingMessage: IncomingMessageRecord
  outgoingResponse: OutgoingResponseRecord
  timestamp: Date | admin.firestore.Timestamp
}

export interface IncomingMessageRecord {
  messageId: string
  content: string
  meta: {
    userAgent: string
    referrer?: string | null
    page: string
    ts: string
  }
  receivedAt: Date | admin.firestore.Timestamp
}

export interface OutgoingResponseRecord {
  responseId: string
  content: string
  sentAt: Date | admin.firestore.Timestamp
  emailSent: boolean
}
