import { EmailLayoutProps } from './email.interfaces'

export interface SubscriberWelcomeProps extends EmailLayoutProps {
  unsubscribeUrl: string
  websiteUrl: string
}

export interface SubscriberDoubleOptInProps extends EmailLayoutProps {
  confirmationUrl: string
  subscriberName?: string
}

export interface SubscriberReconfirmationProps extends EmailLayoutProps {
  reconfirmationUrl: string
}

export interface NewsletterProps extends EmailLayoutProps {
  subscriberName?: string
  postTitle: string
  postImage?: string
  postExcerpt: string
  postUrl: string
  unsubscribeUrl: string
}

export interface UnsubscribeConfirmationProps extends EmailLayoutProps {
  subscriberName?: string
}
