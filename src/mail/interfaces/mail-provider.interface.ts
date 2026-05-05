export interface MailSendPayload {
  from: string
  to: string[]
  subject: string
  html: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
}

export interface MailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Contrato que todo adaptador de email debe implementar.
 * Para agregar un nuevo proveedor (Amazon SES, SendGrid, etc.),
 * crear una nueva clase que implemente esta interfaz e inyectarla
 * en MailModule via el token MAIL_PROVIDER.
 */
export interface IMailProvider {
  send(payload: MailSendPayload): Promise<MailSendResult>
}

export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER')
