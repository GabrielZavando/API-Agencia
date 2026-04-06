import * as admin from 'firebase-admin'

export interface SystemSocialConfig {
  linkedinUrl?: string
  linkedinIconUrl?: string
  instagramUrl?: string
  instagramIconUrl?: string
  githubUrl?: string
  githubIconUrl?: string
  youtubeUrl?: string
  youtubeIconUrl?: string
}

export interface SystemConfig {
  id?: string
  // Technical Config
  maintenanceMode?: boolean
  featuredServices?: string[]

  // Branding / Company Info
  name?: string
  description?: string
  websiteUrl?: string
  logoUrl?: string
  faviconUrl?: string
  address?: string
  phone?: string
  email?: string
  servicesUrl?: string
  social?: SystemSocialConfig

  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue
  updatedBy?: string
}
