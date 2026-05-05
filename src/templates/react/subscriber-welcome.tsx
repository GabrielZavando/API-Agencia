import { Section, Text, Heading, Button, Img } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { SubscriberWelcomeProps } from './interfaces/subscriber.interfaces'

export const SubscriberWelcome = (props: SubscriberWelcomeProps) => {
  const { unsubscribeUrl, ...layoutProps } = props

  const checkIcon = (
    <Img
      src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/action/check_circle/materialicons/24dp/2x/baseline_check_circle_black_24dp.png"
      width="18"
      height="18"
      style={{
        position: 'absolute',
        left: 0,
        top: '2px',
        display: 'inline-block',
      }}
    />
  )

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
          ¡Es un gusto tenerte aquí! 🎉
        </Heading>

        <Section
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '25px',
            margin: '25px 0',
            borderLeft: '4px solid #1D0033',
          }}
        >
          <Text style={{ margin: 0, fontSize: '16px' }}>
            <strong>¡Gracias por suscribirte!</strong>
            <br />
            Has dado el primer paso para estar al tanto de las últimas
            tendencias en transformación digital, desarrollo web y estrategias
            tecnológicas.
          </Text>
        </Section>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Como parte de mi comunidad, recibirás acceso a:
        </Text>

        <ul style={{ padding: 0, margin: '25px 0', listStyle: 'none' }}>
          <li
            style={{
              marginBottom: '12px',
              paddingLeft: '28px',
              position: 'relative',
              fontSize: '16px',
            }}
          >
            {checkIcon}
            <strong>Novedades Tecnológicas:</strong> Actualizaciones semanales
            sobre mis proyectos y stack técnico.
          </li>
          <li
            style={{
              marginBottom: '12px',
              paddingLeft: '28px',
              position: 'relative',
              fontSize: '16px',
            }}
          >
            {checkIcon}
            <strong>Consejos de Desarrollo:</strong> Tips prácticos para
            optimizar tus plataformas digitales.
          </li>
          <li
            style={{
              marginBottom: '12px',
              paddingLeft: '28px',
              position: 'relative',
              fontSize: '16px',
            }}
          >
            {checkIcon}
            <strong>Recursos Exclusivos:</strong> Guías y herramientas que no
            comparto en otros canales públicos.
          </li>
        </ul>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Me esfuerzo por enviar solo contenido de alto valor que realmente
          aporte a tu crecimiento digital.
        </Text>

        <div style={{ textAlign: 'center', marginTop: '25px' }}>
          <Button
            href="https://gabrielzavando.cl/blog"
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
            Visitar Blog
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
          ¿Tienes alguna duda o tema del que te gustaría que hable en el
          boletín? ¡Responde a este correo y hablemos!
        </Text>

        <Text
          style={{
            fontSize: '11px',
            opacity: 0.5,
            marginTop: '30px',
            textAlign: 'center',
          }}
        >
          Recibiste este correo porque estás suscrito al newsletter de Gabriel
          Zavando. Si deseas dejar de recibir estos correos,{' '}
          <a
            href={unsubscribeUrl}
            style={{ color: '#1D0033', textDecoration: 'underline' }}
          >
            puedes darte de baja aquí
          </a>
          .
        </Text>
      </Section>
    </EmailLayout>
  )
}

SubscriberWelcome.PreviewProps = {
  unsubscribeUrl:
    'https://gabrielzavando.cl/unsubscribe?email=test@example.com',
  previewText: 'Bienvenido a mi newsletter digital',
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

export default SubscriberWelcome
