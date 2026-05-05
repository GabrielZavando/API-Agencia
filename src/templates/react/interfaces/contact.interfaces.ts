import { EmailLayoutProps } from './email.interfaces'

export interface BienvenidaContactoProps extends EmailLayoutProps {
  prospectName: string
  websiteUrl: string
  calendlyUrl: string
}

export interface RegresoContactoProps extends EmailLayoutProps {
  prospectName: string
  websiteUrl: string
  calendlyUrl: string
}
