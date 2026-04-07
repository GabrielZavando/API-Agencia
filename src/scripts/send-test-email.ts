import * as nodemailer from 'nodemailer'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { companyConfig } from '../config/company.config'

// Cargar variables de entorno desde el directorio raíz de la API
dotenv.config()

async function sendTestEmail() {
  const to = 'gabrielzavando@gmail.com'
  const templateName = 'report-delivery'

  console.log('🚀 Iniciando envío de prueba...')
  console.log(`📧 Destinatario: ${to}`)
  console.log(`📄 Plantilla: ${templateName}`)

  const smtpSecure = process.env.SMTP_SECURE !== 'false'
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: smtpSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  try {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'email',
      `${templateName}.html`,
    )

    if (!fs.existsSync(templatePath)) {
      throw new Error(`No se encontró la plantilla en: ${templatePath}`)
    }

    let template = fs.readFileSync(templatePath, 'utf8')

    // Variables base (simulando MailService.getBaseVariables)
    const variables: Record<string, string> = {
      name: companyConfig.name,
      siteName: companyConfig.name,
      websiteUrl: companyConfig.websiteUrl,
      logoUrl: companyConfig.logoUrl,
      address: companyConfig.address,
      phone: companyConfig.phone,
      email: companyConfig.email,
      linkedinUrl: companyConfig.social.linkedinUrl,
      linkedinIconUrl: companyConfig.social.linkedinIconUrl,
      youtubeUrl: companyConfig.social.youtubeUrl,
      youtubeIconUrl: companyConfig.social.youtubeIconUrl,
      githubUrl: companyConfig.social.githubUrl,
      githubIconUrl: companyConfig.social.githubIconUrl,
      instagramUrl: companyConfig.social.instagramUrl,
      instagramIconUrl: companyConfig.social.instagramIconUrl,
      unsubscribeUrl: `${companyConfig.websiteUrl}/unsubscribe?email=${to}`,
      currentYear: new Date().getFullYear().toString(),
    }

    // Reemplazo simple como hace el TemplateService
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      template = template.replace(regex, variables[key] || '')
    })

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    const mailOptions = {
      from: `"${companyConfig.name}" <${fromEmail}>`,
      to,
      subject: '🎉 Prueba de Correo: ¡Bienvenido a mi newsletter!',
      html: template,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email enviado con éxito!')
    console.log('🆔 Message ID:', info.messageId)
  } catch (error) {
    console.error('❌ Error enviando email:', error)
    process.exit(1)
  }
}

// Iniciar proceso
void sendTestEmail()
