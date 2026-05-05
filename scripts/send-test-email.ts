import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/app.module'
import { MailService } from '../src/mail/mail.service'
import { companyConfig } from '../src/config/company.config'

/**
 * Script de prueba FINAL para validar el renderizado real.
 * Ejecución: npx ts-node scripts/send-test-email.ts
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const mailService = app.get(MailService)

  const testEmail = 'gabrielzavando@gmail.com'

  console.log(`Enviando notificación real a: ${testEmail}...`)

  try {
    const { TemplateService } =
      await import('../src/templates/template.service')
    const templateService = app.get(TemplateService)
    const { ReportDelivery } =
      await import('../src/templates/react/report-delivery')
    const React = await import('react')

    const baseVars = mailService.getBaseVariables(testEmail)

    const html = await templateService.renderReactTemplate(
      React.createElement(ReportDelivery, {
        ...baseVars,
        previewText: 'Tu reporte está listo para ser revisado',
        clientName: 'Gabriel Zavando',
        reportTitle: 'Actualización de Identidad Visual',
        reportProject: 'WebAstro v2.0',
        reportDescription:
          'Validación de logo y nombre dinámico tras la desvinculación de los sistemas de la Landing.',
        websiteUrl: baseVars['websiteUrl'] as string,
        logoUrl: baseVars['logoUrl'] as string,
        companyName: baseVars['companyName'] as string,
        address: baseVars['address'] as string,
        email: baseVars['email'] as string,
        currentYear: baseVars['currentYear'] as string,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        social: baseVars['social'] as any,
      }),
    )

    const success = await mailService.sendMail({
      to: testEmail,
      subject: `Notificación de Prueba | ${companyConfig.name}`,
      html,
    })

    if (success) {
      console.log(
        '✅ ¡Éxito! El correo ha sido enviado correctamente con los datos de producción.',
      )
    } else {
      console.error(
        '❌ Error: El servicio de correo no pudo completar el envío.',
      )
    }
  } catch (error) {
    console.error('❌ Excepción durante el envío:', error)
  } finally {
    await app.close()
    process.exit(0)
  }
}

void bootstrap()
