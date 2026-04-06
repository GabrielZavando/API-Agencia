export type MailAccount = 'CONTACT' | 'SUPPORT'

export interface MailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

export interface MailOptions {
  to: string
  subject: string
  templateName?: string
  templateVariables?: Record<string, unknown>
  html?: string
  isNewProspect?: boolean
  from?: string
  account?: MailAccount
  attachments?: MailAttachment[]
}
