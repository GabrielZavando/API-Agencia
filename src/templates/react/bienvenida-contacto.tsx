import { Section, Text, Heading, Img } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { BienvenidaContactoProps } from './interfaces/contact.interfaces'

export const BienvenidaContacto = (props: BienvenidaContactoProps) => {
  const { prospectName, ...layoutProps } = props

  return (
    <EmailLayout {...layoutProps}>
      <Section>
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
          ¡Hola {prospectName}!
        </Heading>
        <Text style={{ fontSize: '16px', margin: '0 0 15px 0' }}>
          Gracias por escribirme. Tu mensaje ya está en mi bandeja de entrada.
        </Text>
        <Text style={{ fontSize: '16px', margin: '0 0 15px 0' }}>
          Antes de hablar de tecnología o código, mi enfoque es{' '}
          <strong>Cerebro antes que Músculo</strong>: primero entendemos tus
          procesos reales, identificamos dónde pierdes tiempo o dinero, y solo
          después diseñamos la solución técnica que te devuelva el control.
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
          <Text style={{ margin: 0, fontWeight: 700, color: '#1D0033' }}>
            Qué pasará a continuación:
          </Text>
          <ol
            style={{
              margin: '15px 0 0 0',
              paddingLeft: '20px',
              fontSize: '15px',
              color: '#1D0033',
            }}
          >
            <li style={{ marginBottom: '8px' }}>
              Revisaré tu mensaje y contexto de negocio.
            </li>
            <li style={{ marginBottom: '8px' }}>
              Te responderé personalmente en un máximo de 24 horas hábiles.
            </li>
            <li style={{ marginBottom: '0' }}>
              Te enviaré un enlace para que reserves una reunión online (30 min,
              sin costo), donde definiremos el plan de acción para tu negocio.
            </li>
          </ol>
        </Section>

        <Section style={{ marginTop: '20px', marginBottom: '10px' }}>
          <Img
            src="https://cdn.jsdelivr.net/gh/google/material-design-icons@master/png/device/access_time/materialicons/24dp/2x/baseline_access_time_black_24dp.png"
            width="36"
            height="36"
            alt="⏰"
            style={{ display: 'block' }}
          />
        </Section>

        <Text style={{ fontSize: '16px', margin: '0 0 20px 0' }}>
          <strong>Mientras tanto:</strong> Si tienes a mano un resumen de tus
          procesos actuales, herramientas que usas hoy o el punto de dolor más
          urgente, tenlo listo. Nos servirá para aprovechar al máximo nuestra
          primera conversación.
        </Text>

        <Text
          style={{
            fontSize: '16px',
            margin: '0 0 30px 0',
            fontWeight: 600,
            color: '#1D0033',
          }}
        >
          <span style={{ fontStyle: 'italic' }}>
            "Tu empresa no debería adaptarse al software. Construyo sistemas que
            se adaptan a tu realidad."
          </span>
          <br />
          Hablamos muy pronto.
        </Text>
      </Section>
    </EmailLayout>
  )
}

BienvenidaContacto.PreviewProps = {
  prospectName: 'Pablo Torres',
  websiteUrl: 'https://gabrielzavando.cl',
  calendlyUrl: 'https://calendly.com/gabrielzavando/30min',
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

export default BienvenidaContacto
