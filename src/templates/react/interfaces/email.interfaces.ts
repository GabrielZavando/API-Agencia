import * as React from 'react'

export interface SocialLinksProps {
  linkedinUrl: string
  linkedinIconUrl: string
  instagramUrl: string
  instagramIconUrl: string
  githubUrl: string
  githubIconUrl: string
  youtubeUrl: string
  youtubeIconUrl: string
}

export interface EmailLayoutProps {
  previewText: string
  logoUrl: string
  companyName: string
  address: string
  email: string
  currentYear: string
  social: SocialLinksProps
  children?: React.ReactNode
}
