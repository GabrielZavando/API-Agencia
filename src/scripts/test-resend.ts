import { Resend } from 'resend'
import * as dotenv from 'dotenv'

dotenv.config()

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY no encontrada en .env')
    return
  }

  const resend = new Resend(apiKey)
  const from = 'Gabriel Zavando <no-reply@notify.gabrielzavando.cl>'
  const to = 'gabrielzavando@gmail.com'

  console.log('🚀 Probando conexión con Resend...')
  console.log(`📤 Remitente: ${from}`)
  console.log(`📥 Destinatario: ${to}`)

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: 'Prueba de Conexión - Resend API',
      html: '<strong>Si lees esto, la conexión con Resend funciona correctamente.</strong>',
    })

    if (error) {
      console.error('❌ Error de Resend:', error.message)
      if (error.message.includes('domain')) {
        console.log(
          '💡 Sugerencia: Verifica que el dominio notify.gabrielzavando.cl esté validado en Resend.',
        )
      }
    } else {
      console.log('✅ Email enviado con éxito!')
      console.log('🆔 ID del mensaje:', data?.id)
    }
  } catch (err) {
    console.error('💥 Error inesperado:', err)
  }
}

void testResend()
