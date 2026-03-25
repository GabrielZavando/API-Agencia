import { Injectable, InternalServerErrorException } from '@nestjs/common'
import * as admin from 'firebase-admin'
import { UpdateSystemConfigDto } from './dto/update-config.dto'

export interface SystemConfig {
  siteName: string
  contactEmail: string
  maintenanceMode: boolean
  enableRegistrations: boolean
  features: Record<string, boolean>
  branding: {
    primaryColor: string
    logoUrl: string
  }
  updatedAt: Date
}

@Injectable()
export class SystemConfigService {
  private readonly collectionName = 'system_config'
  private readonly documentId = 'global'

  private get collection() {
    return admin.firestore().collection(this.collectionName)
  }

  async getConfig(): Promise<SystemConfig | null> {
    try {
      const doc = await this.collection.doc(this.documentId).get()
      if (!doc.exists) {
        return this.createDefaultConfig()
      }
      return doc.data() as SystemConfig
    } catch {
      throw new InternalServerErrorException(
        'Error al recuperar la configuración del sistema',
      )
    }
  }

  async updateConfig(dto: UpdateSystemConfigDto): Promise<SystemConfig> {
    try {
      const docRef = this.collection.doc(this.documentId)
      const updateData = {
        ...dto,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }

      await docRef.set(updateData, { merge: true })

      const updatedDoc = await docRef.get()
      return updatedDoc.data() as SystemConfig
    } catch {
      throw new InternalServerErrorException(
        'Error al actualizar la configuración del sistema',
      )
    }
  }

  private async createDefaultConfig(): Promise<SystemConfig> {
    const defaultData = {
      siteName: 'WebAstro',
      contactEmail: 'admin@webastro.com',
      maintenanceMode: false,
      enableRegistrations: true,
      features: {
        blog: true,
        ideas: true,
        support: true,
      },
      branding: {
        primaryColor: '#FF0080',
        logoUrl: '/favicon.svg',
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    await this.collection.doc(this.documentId).set(defaultData)
    return defaultData as unknown as SystemConfig
  }
}
