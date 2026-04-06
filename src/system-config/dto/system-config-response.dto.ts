export class SystemConfigResponseDto {
  name: string
  description: string
  websiteUrl: string
  logoUrl: string
  faviconUrl?: string
  address?: string
  phone?: string
  email?: string
  servicesUrl?: string
  social: {
    linkedinUrl?: string
    instagramUrl?: string
    githubUrl?: string
    youtubeUrl?: string
    linkedinIconUrl?: string
    instagramIconUrl?: string
    githubIconUrl?: string
    youtubeIconUrl?: string
  }
}
