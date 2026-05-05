import { Section, Text, Heading, Button, Img } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { TicketCreatedProps } from './interfaces/support.interfaces'

export const TicketCreated = (props: TicketCreatedProps) => {
  const {
    ticketId,
    clientEmail,
    subject,
    message,
    priority,
    date,
    websiteUrl,
    ...layoutProps
  } = props

  const iconStyle = {
    display: 'inline-block',
    verticalAlign: 'middle',
    marginRight: '8px',
  }

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
          NUEVO TICKET #{ticketId}
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
          Nuevo ticket recibido
        </Heading>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Hola Gabriel,
        </Text>
        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Un cliente ha abierto un nuevo ticket de soporte. Aquí tienes los
          detalles para su revisión:
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
          <Text style={{ margin: '8px 0', fontSize: '15px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/social/person/materialicons/24dp/2x/baseline_person_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Cliente:</strong> {clientEmail}
          </Text>
          <Text style={{ margin: '10px 0 0 0', fontSize: '15px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/action/label/materialicons/24dp/2x/baseline_label_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Asunto:</strong> {subject}
          </Text>
          <Text style={{ margin: '10px 0 0 0', fontSize: '15px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/communication/message/materialicons/24dp/2x/baseline_message_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Mensaje:</strong> {message}
          </Text>
          <Text style={{ margin: '10px 0 0 0', fontSize: '15px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/notification/priority_high/materialicons/24dp/2x/baseline_priority_high_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Prioridad:</strong> {priority}
          </Text>
          <Text
            style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#64748B' }}
          >
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/action/event/materialicons/24dp/2x/baseline_event_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Fecha:</strong> {date}
          </Text>
        </Section>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Puedes gestionar el ticket y responder desde el panel de
          administración:
        </Text>

        <div style={{ textAlign: 'center', marginTop: '25px' }}>
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
            Gestionar Ticket
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

TicketCreated.PreviewProps = {
  userName: 'Pablo Torres',
  ticketId: '5501',
  ticketSubject: 'Problema con el despliegue en Cloud Run',
  websiteUrl: 'https://gabrielzavando.cl',
  previewText: 'Tu ticket de soporte #5501 ha sido creado',
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

export default TicketCreated
