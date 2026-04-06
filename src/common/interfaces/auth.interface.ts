import { Request as ExpressRequest } from 'express'
import * as admin from 'firebase-admin'

export interface AuthRequest extends ExpressRequest {
  user: admin.auth.DecodedIdToken & {
    role?: string
    [key: string]: any
  }
}
