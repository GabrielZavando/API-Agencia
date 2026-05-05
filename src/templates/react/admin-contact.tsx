import { Section, Text, Heading, Img } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { AdminContactProps } from './interfaces/admin.interfaces'

export const AdminContact = (props: AdminContactProps) => {
  const {
    typeLabel,
    contactName,
    contactEmail,
    contactPhone,
    date,
    contactMessage,
    autoResponse,
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
            background: '#6B21A8',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '11px',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          {typeLabel}
        </div>
        <Heading
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '20px',
            color: '#6B21A8',
            marginBottom: '25px',
            fontWeight: 700,
            marginTop: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Mensaje de {contactName}
        </Heading>

        <Section
          style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            padding: '20px',
            margin: '20px 0',
          }}
        >
          <Text style={{ margin: '8px 0', fontSize: '14px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/communication/email/materialicons/24dp/2x/baseline_email_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Email:</strong>{' '}
            <a
              href={`mailto:${contactEmail}`}
              style={{ color: '#6B21A8', textDecoration: 'none' }}
            >
              {contactEmail}
            </a>
          </Text>
          <Text style={{ margin: '8px 0', fontSize: '14px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/communication/call/materialicons/24dp/2x/baseline_call_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Teléfono:</strong> {contactPhone}
          </Text>
          <Text style={{ margin: '8px 0', fontSize: '14px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/action/event/materialicons/24dp/2x/baseline_event_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Fecha:</strong> {date}
          </Text>
        </Section>

        <Text
          style={{
            fontWeight: 600,
            color: '#6B21A8',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Img
            src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/communication/chat/materialicons/24dp/2x/baseline_chat_black_24dp.png"
            width="18"
            height="18"
            style={iconStyle}
          />
          Contenido del mensaje:
        </Text>
        <Section
          style={{
            background: '#FFFEEB',
            borderLeft: '4px solid #6B21A8',
            padding: '20px',
            margin: '25px 0',
            fontStyle: 'italic',
            color: '#4b2185',
          }}
        >
          <Text style={{ margin: 0 }}>"{contactMessage}"</Text>
        </Section>

        <Section
          style={{
            background: '#ECFDF5',
            border: '1px solid #10B981',
            padding: '15px',
            marginTop: '30px',
          }}
        >
          <Text
            style={{
              margin: 0,
              color: '#065F46',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@master/png/hardware/smart_toy/materialicons/24dp/2x/baseline_smart_toy_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            Respuesta automática enviada:
          </Text>
          <Text
            style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#047857' }}
          >
            {autoResponse}
          </Text>
        </Section>
      </Section>
    </EmailLayout>
  )
}

AdminContact.PreviewProps = {
  typeLabel: 'Nuevo Contacto Recibido',
  contactName: 'Pablo Torres',
  contactEmail: 'pablo.torres@gmail.com',
  contactPhone: '+56 9 8765 4321',
  date: '02 de Mayo, 2024 - 22:15',
  contactMessage:
    'Hola Gabriel, me interesa el Pack Sistemas para automatizar mi flujo de ventas. ¿Podemos agendar una reunión?',
  autoResponse: 'Recibí tu mensaje. Te contactaré en menos de 24 horas.',
  previewText: 'Nuevo mensaje de contacto: Pablo Torres',
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

export default AdminContact
