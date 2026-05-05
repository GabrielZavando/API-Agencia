import {
  Section,
  Text,
  Heading,
  Button,
  Img,
  Row,
  Column,
} from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { SubscriberReconfirmationProps } from './interfaces/subscriber.interfaces'

export const SubscriberReconfirmation = (
  props: SubscriberReconfirmationProps,
) => {
  const { reconfirmationUrl, ...layoutProps } = props

  return (
    <EmailLayout {...layoutProps}>
      <Section style={{ textAlign: 'center' }}>
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
          ¿Deseas seguir recibiendo mi contenido?
        </Heading>

        <Text
          style={{ margin: '0 0 15px 0', fontSize: '16px', textAlign: 'left' }}
        >
          Hola:
        </Text>
        <Text
          style={{ margin: '0 0 15px 0', fontSize: '16px', textAlign: 'left' }}
        >
          He notado que no has interactuado con mis últimos boletines. Para
          asegurar que solo recibas contenido que realmente te interese,
          necesito que reconfirmes tu suscripción haciendo clic abajo:
        </Text>

        <div style={{ marginTop: '30px' }}>
          <Button
            href={reconfirmationUrl}
            style={{
              display: 'inline-block',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              textDecoration: 'none',
              padding: '18px 36px',
              background: '#FF0080',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              fontSize: '14px',
              letterSpacing: '1px',
            }}
          >
            Sí, deseo continuar suscrito
          </Button>
        </div>

        <Section
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '15px 20px',
            margin: '25px 0',
            borderRadius: '6px',
          }}
        >
          <Row>
            <Column style={{ width: '28px', verticalAlign: 'middle' }}>
              <Img
                src="https://cdn.jsdelivr.net/gh/google/material-design-icons@master/png/action/info/materialicons/24dp/2x/baseline_info_black_24dp.png"
                width="18"
                height="18"
                alt="ℹ️"
                style={{ display: 'block' }}
              />
            </Column>
            <Column style={{ verticalAlign: 'middle' }}>
              <Text
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#475569',
                  textAlign: 'left',
                  lineHeight: 1.4,
                }}
              >
                Si no realizas ninguna acción en los próximos días, serás dado
                de baja automáticamente para mantener tu bandeja limpia.
              </Text>
            </Column>
          </Row>
        </Section>
      </Section>
    </EmailLayout>
  )
}

SubscriberReconfirmation.PreviewProps = {
  reconfirmationUrl:
    'https://gabrielzavando.cl/reconfirm-subscription?token=xyz789',
  previewText: '¿Deseas seguir recibiendo mi contenido?',
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

export default SubscriberReconfirmation
