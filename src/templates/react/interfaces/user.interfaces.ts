import { EmailLayoutProps } from './email.interfaces'

export interface UserWelcomeProps extends EmailLayoutProps {
  userName: string
  userEmail: string
  pass: string
  role: string
  websiteUrl: string
}
