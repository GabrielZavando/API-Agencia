import { Section, Text, Heading, Img } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { AdminSubscriptionProps } from './interfaces/admin.interfaces'

export const AdminSubscription = (props: AdminSubscriptionProps) => {
  const {
    subscriberEmail,
    date,
    pageOrigin,
    referrer,
    userAgent,
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
          Gestión Interna
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
          ¡Tienes un nuevo suscriptor!
        </Heading>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Se ha registrado una nueva dirección de correo en la lista de difusión
          oficial:
        </Text>

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
              href={`mailto:${subscriberEmail}`}
              style={{ color: '#6B21A8', textDecoration: 'none' }}
            >
              {subscriberEmail}
            </a>
          </Text>
          <Text style={{ margin: '8px 0', fontSize: '14px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/action/event/materialicons/24dp/2x/baseline_event_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Fecha de Registro:</strong> {date}
          </Text>
          <Text style={{ margin: '8px 0', fontSize: '14px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/av/web/materialicons/24dp/2x/baseline_web_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Origen (Página):</strong> {pageOrigin || 'Desconocido'}
          </Text>
          <Text style={{ margin: '8px 0', fontSize: '14px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/content/link/materialicons/24dp/2x/baseline_link_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Referer:</strong> {referrer || 'Directo'}
          </Text>
          <Text style={{ margin: '8px 0', fontSize: '14px', color: '#6B7280' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/device/devices/materialicons/24dp/2x/baseline_devices_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>User Agent:</strong> {userAgent || 'Desconocido'}
          </Text>
        </Section>

        <Text
          style={{
            fontSize: '14px',
            color: '#6B7280',
            marginTop: '30px',
            margin: 0,
          }}
        >
          Este usuario recibirá automáticamente la bienvenida y las
          actualizaciones futuras que publiques en el blog.
        </Text>
      </Section>
    </EmailLayout>
  )
}

AdminSubscription.PreviewProps = {
  subscriberEmail: 'nuevo.suscriptor@example.com',
  date: '02 de Mayo, 2024',
  pageOrigin: '/blog/post-ia-automatizacion',
  referrer: 'https://google.com',
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  previewText: 'Nuevo suscriptor registrado',
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

export default AdminSubscription
