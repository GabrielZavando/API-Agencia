import { EmailLayoutProps } from './email.interfaces'

export interface AdminContactProps extends EmailLayoutProps {
  typeLabel: string
  contactName: string
  contactEmail: string
  contactPhone: string
  date: string
  contactMessage: string
  autoResponse: string
}

export interface AdminSubscriptionProps extends EmailLayoutProps {
  subscriberEmail: string
  date: string
  pageOrigin?: string
  referrer?: string
  userAgent?: string
}
