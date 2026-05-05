import { Section, Text, Heading, Button } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { TicketReplyProps } from './interfaces/support.interfaces'

export const TicketReply = (props: TicketReplyProps) => {
  const { ticketId, clientEmail, message, date, websiteUrl, ...layoutProps } =
    props

  return (
    <EmailLayout {...layoutProps}>
      <Section>
        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: '#471761',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '15px',
          }}
        >
          NUEVA RÉPLICA - Ticket #{ticketId}
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
          El cliente ha respondido
        </Heading>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Hola Gabriel,
        </Text>
        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Has recibido un nuevo mensaje en el ticket de soporte. Detalle de la
          actualización:
        </Text>

        <Section
          style={{
            background: '#FFFEEB',
            borderLeft: '4px solid #471761',
            padding: '25px',
            margin: '25px 0',
            fontStyle: 'italic',
            color: '#1D0033',
          }}
        >
          <Text style={{ margin: 0, fontSize: '15px' }}>"{message}"</Text>
        </Section>

        <Text
          style={{ fontSize: '13px', color: '#64748B', margin: '0 0 25px 0' }}
        >
          <strong>De:</strong> {clientEmail}
          <br />
          <strong>Fecha:</strong> {date}
        </Text>

        <div style={{ textAlign: 'center' }}>
          <Button
            href={`${websiteUrl}/admin/tickets/${ticketId}`}
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
            Responder al Cliente
          </Button>
        </div>

        <Text
          style={{
            marginTop: '30px',
            fontSize: '14px',
            color: '#64748b',
            fontStyle: 'italic',
          }}
        >
          Este es un aviso automático del sistema de Gabriel Zavando.
        </Text>
      </Section>
    </EmailLayout>
  )
}

TicketReply.PreviewProps = {
  ticketId: '5501',
  clientEmail: 'pablo.torres@example.com',
  message:
    'Hola Gabriel, adjunto los logs del error que mencioné anteriormente. Sigo atento a tus comentarios.',
  date: '02 de Mayo, 2024 - 15:45',
  websiteUrl: 'https://gabrielzavando.cl',
  previewText: 'Nueva réplica en ticket #5501',
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

export default TicketReply
