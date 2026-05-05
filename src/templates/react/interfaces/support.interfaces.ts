import { EmailLayoutProps } from './email.interfaces'

export interface TicketCreatedProps extends EmailLayoutProps {
  ticketId: string
  clientEmail: string
  subject: string
  message: string
  priority: string
  date: string
  websiteUrl: string
}

export interface TicketReplyProps extends EmailLayoutProps {
  ticketId: string
  clientEmail: string
  message: string
  date: string
  websiteUrl: string
}

export interface TicketResponseProps extends EmailLayoutProps {
  userName: string
  ticketId: string
  ticketSubject: string
  responseMessage: string
  websiteUrl: string
}
