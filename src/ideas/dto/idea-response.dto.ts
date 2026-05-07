import * as admin from 'firebase-admin'

export class IdeaResponseDto {
  id: string
  name: string
  explanation: string
  imageUrl?: string
  clientId: string
  clientName?: string
  createdAt: string
}
