import { Injectable, OnModuleInit } from '@nestjs/common'
import { FirebaseService } from '../firebase/firebase.service'
import { companyConfig } from '../config/company.config'
import { UpdateSystemConfigDto } from './dto/update-config.dto'
import { SystemConfigResponseDto } from './dto/system-config-response.dto'

@Injectable()
export class SystemConfigService implements OnModuleInit {
  private cachedConfig: SystemConfigResponseDto | null = null
  private lastFetch = 0
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutos

  constructor(private readonly firebaseService: FirebaseService) {}

  async onModuleInit() {
    await this.getConfig()
  }

  async getConfig(): Promise<SystemConfigResponseDto> {
    const now = Date.now()
    if (this.cachedConfig && now - this.lastFetch < this.CACHE_TTL) {
      return this.cachedConfig
    }

    try {
      const db = this.firebaseService.getDb()
      const doc = await db.collection('system_config').doc('global').get()

      if (!doc.exists) {
        return this.createDefaultConfig()
      }

      const rawData = doc.data() as Record<string, any>

      // MAPEADO INTELIGENTE (Legacy -> New Schema)
      const mappedData: SystemConfigResponseDto = {
        name:
          (rawData['name'] as string) ||
          (rawData['siteName'] as string) ||
          companyConfig.name,
        description:
          (rawData['description'] as string) || companyConfig.description,
        websiteUrl:
          (rawData['websiteUrl'] as string) || companyConfig.websiteUrl,
        logoUrl:
          (rawData['logoUrl'] as string) ||
          (rawData['branding'] as Record<string, string>)?.['logoUrl'] ||
          companyConfig.logoUrl,
        faviconUrl:
          (rawData['faviconUrl'] as string) ||
          (rawData['branding'] as Record<string, string>)?.['faviconUrl'] ||
          (rawData['logoUrl'] as string) ||
          companyConfig.logoUrl,
        address: (rawData['address'] as string) || companyConfig.address,
        phone: (rawData['phone'] as string) || companyConfig.phone,
        email:
          (rawData['email'] as string) ||
          (rawData['contactEmail'] as string) ||
          companyConfig.email,
        servicesUrl:
          (rawData['servicesUrl'] as string) || companyConfig.servicesUrl,
        social: (() => {
          const s = rawData['social'] as Record<string, string> | undefined
          return {
            linkedinUrl: s?.['linkedinUrl'] || companyConfig.social.linkedinUrl,
            linkedinIconUrl:
              s?.['linkedinIconUrl'] || companyConfig.social.linkedinIconUrl,
            instagramUrl:
              s?.['instagramUrl'] || companyConfig.social.instagramUrl,
            instagramIconUrl:
              s?.['instagramIconUrl'] || companyConfig.social.instagramIconUrl,
            githubUrl: s?.['githubUrl'] || companyConfig.social.githubUrl,
            githubIconUrl:
              s?.['githubIconUrl'] || companyConfig.social.githubIconUrl,
            youtubeUrl: s?.['youtubeUrl'] || companyConfig.social.youtubeUrl,
            youtubeIconUrl:
              s?.['youtubeIconUrl'] || companyConfig.social.youtubeIconUrl,
          }
        })(),
      }

      this.cachedConfig = mappedData
      this.lastFetch = now
      return this.cachedConfig
    } catch (error) {
      console.error('Error fetching system config:', error)
      return this.createDefaultConfig()
    }
  }

  async updateConfig(
    dto: UpdateSystemConfigDto,
  ): Promise<SystemConfigResponseDto> {
    await this.firebaseService.updateSystemConfig(dto)

    // Invalidar caché / Actualizar localmente
    this.cachedConfig = {
      ...dto,
    } as SystemConfigResponseDto
    this.lastFetch = Date.now()

    return this.cachedConfig
  }

  private createDefaultConfig(): SystemConfigResponseDto {
    return {
      name: companyConfig.name,
      description: companyConfig.description,
      websiteUrl: companyConfig.websiteUrl,
      logoUrl: companyConfig.logoUrl,
      faviconUrl: companyConfig.logoUrl, // Fallback al logo
      address: companyConfig.address,
      phone: companyConfig.phone,
      email: companyConfig.email,
      servicesUrl: companyConfig.servicesUrl,
      social: { ...companyConfig.social },
    }
  }
}
