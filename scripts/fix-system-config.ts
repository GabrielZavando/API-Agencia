import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/app.module'
import { SystemConfigService } from '../src/system-config/system-config.service'
import { companyConfig } from '../src/config/company.config'

/**
 * Script de corrección para sincronizar Firestore con company.config.ts
 * Ejecución: npx ts-node scripts/fix-system-config.ts
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const systemConfigService = app.get(SystemConfigService)

  try {
    console.log('Actualizando documento system_config/global...')

    // Forzamos la actualización con los datos maestros de company.config.ts
    await systemConfigService.updateConfig({
      name: companyConfig.name,
      description: companyConfig.description,
      websiteUrl: companyConfig.websiteUrl,
      logoUrl: companyConfig.logoUrl,
      faviconUrl: companyConfig.logoUrl,
      address: companyConfig.address,
      phone: companyConfig.phone,
      email: companyConfig.email,
      servicesUrl: companyConfig.servicesUrl,
      social: { ...companyConfig.social },
    })

    console.log('✅ ¡Base de Datos Sincronizada!')
    console.log(`Nuevo Nombre: ${companyConfig.name}`)
    console.log(`Nueva URL Logo: ${companyConfig.logoUrl}`)
  } catch (error) {
    console.error('❌ Error sincronizando base de datos:', error)
  } finally {
    await app.close()
    process.exit(0)
  }
}

void bootstrap()
