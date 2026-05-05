import { Section, Text, Heading, Img } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { RegresoContactoProps } from './interfaces/contact.interfaces'

export const RegresoContacto = (props: RegresoContactoProps) => {
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
          ¡Hola de nuevo {prospectName}!
        </Heading>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Gracias por volver a escribirme. He registrado tu nueva consulta y ya
          la estoy revisando.
        </Text>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Mi enfoque se mantiene intacto:{' '}
          <strong>Cerebro antes que Músculo</strong>. Antes de proponer
          herramientas o cronogramas, analizo tu nueva necesidad, detecto dónde
          está la fricción hoy y diseño la ruta técnica que realmente resuelva
          este desafío sin crear dependencia.
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
              Evaluaré esta nueva consulta
            </li>
            <li style={{ marginBottom: '8px' }}>
              Te responderé personalmente en un máximo de 24 horas hábiles.
            </li>
            <li style={{ marginBottom: '0' }}>
              De ser necesario, te enviaré un enlace para que reserves una
              reunión online (30 min, sin costo), donde definiremos el plan de
              acción para tu negocio.
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

        <Text style={{ margin: '0 0 20px 0', fontSize: '16px' }}>
          <strong>Mientras tanto:</strong> Si ya tienes claridad sobre los
          cambios en tu operación, las herramientas que quieres integrar o el
          punto de partida de este nuevo objetivo, tenlo a mano. Nos permitirá
          afinar la estrategia desde la primera conversación.
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
            "La tecnología debe evolucionar contigo, no al revés. Hablamos muy
            pronto."
          </span>
        </Text>
      </Section>
    </EmailLayout>
  )
}

RegresoContacto.PreviewProps = {
  prospectName: 'Pablo Torres',
  websiteUrl: 'https://gabrielzavando.cl',
  calendlyUrl: 'https://calendly.com/gabrielzavando/30min',
  previewText: '¡Qué gusto verte de nuevo!',
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

export default RegresoContacto
