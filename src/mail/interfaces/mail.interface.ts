export type MailAccount = 'CONTACT' | 'NOTIFY' | 'SUPPORT' | 'ADMIN'

export interface MailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

export interface MailOptions {
  to: string
  subject: string
  html?: string
  isNewProspect?: boolean
  from?: string
  replyTo?: string
  account?: MailAccount
  attachments?: MailAttachment[]
}
