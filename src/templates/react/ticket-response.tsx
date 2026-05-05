import { Section, Text, Heading, Button } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { TicketResponseProps } from './interfaces/support.interfaces'

export const TicketResponse = (props: TicketResponseProps) => {
  const {
    userName,
    ticketId,
    ticketSubject,
    responseMessage,
    websiteUrl,
    ...layoutProps
  } = props

  return (
    <EmailLayout {...layoutProps}>
      <Section>
        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: '#471761',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '11px',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          Ticket Actualizado
        </div>
        <Heading
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '24px',
            color: '#1D0033',
            marginBottom: '25px',
            fontWeight: 700,
            marginTop: 0,
          }}
        >
          Novedades en tu solicitud
        </Heading>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Hola <strong>{userName}</strong>,
        </Text>
        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          He respondido a tu ticket de soporte. Puedes revisar la actualización
          a continuación:
        </Text>

        <Section
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '25px',
            margin: '25px 0',
            borderLeft: '4px solid #471761',
          }}
        >
          <Text
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              color: '#111827',
            }}
          >
            TICKET #{ticketId}: {ticketSubject}
          </Text>
          <Text
            style={{
              margin: '15px 0 0 0',
              fontSize: '14px',
              color: '#374151',
              lineHeight: 1.6,
              borderTop: '1px solid #E5E7EB',
              paddingTop: '15px',
            }}
          >
            "{responseMessage}"
          </Text>
        </Section>

        <Text
          style={{ color: '#64748b', fontSize: '14px', margin: '0 0 15px 0' }}
        >
          Si necesitas añadir más información o responder a este comentario,
          puedes hacerlo directamente desde el portal de soporte:
        </Text>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Button
            href={`${websiteUrl}/dashboard/soporte/${ticketId}`}
            style={{
              display: 'inline-block',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              textDecoration: 'none',
              padding: '16px 32px',
              background: '#FF0080',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              fontSize: '14px',
              letterSpacing: '1px',
            }}
          >
            Ver Conversación
          </Button>
        </div>
      </Section>
    </EmailLayout>
  )
}

TicketResponse.PreviewProps = {
  userName: 'Pablo Torres',
  ticketId: '5501',
  ticketSubject: 'Problema con el despliegue en Cloud Run',
  responseMessage:
    'Hola Pablo, hemos revisado los logs y detectamos que faltaba una variable de entorno. Ya ha sido corregido y el servicio está arriba nuevamente.',
  websiteUrl: 'https://gabrielzavando.cl',
  previewText: 'Actualización en Ticket #5501',
  logoUrl:
    'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/src/assets/img/logo-medium.png',
  companyName: 'Gabriel Zavando | Full Stack Developer',
  address: 'Viña del Mar',
  phone: '+56 9 641 65 631',
  email: 'contacto@gabrielzavando.cl',
  currentYear: new Date().getFullYear().toString(),
  social: {
    linkedinUrl: 'https://linkedin.com/in/gabrielzavando',
    linkedinIconUrl:
      'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/src/assets/icons/linkedin_icon.png',
    instagramUrl: 'https://instagram.com/gabrielzavando',
    instagramIconUrl:
      'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/src/assets/icons/instagram_icon.png',
    githubUrl: 'https://github.com/gabrielzavando',
    githubIconUrl:
      'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/src/assets/icons/github_icon.png',
    youtubeUrl: 'https://www.youtube.com/@gabrielzavando',
    youtubeIconUrl:
      'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/src/assets/icons/youtube_icon.png',
  },
}

export default TicketResponse
