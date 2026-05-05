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
import { SubscriberDoubleOptInProps } from './interfaces/subscriber.interfaces'

export const SubscriberDoubleOptIn = (props: SubscriberDoubleOptInProps) => {
  const { confirmationUrl, subscriberName = 'ahí', ...layoutProps } = props

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
          Sólo un paso más por favor...
        </Heading>

        <Text
          style={{ margin: '0 0 15px 0', fontSize: '16px', textAlign: 'left' }}
        >
          Hola, {subscriberName}:
        </Text>

        <Text
          style={{ margin: '0 0 15px 0', fontSize: '16px', textAlign: 'left' }}
        >
          Gracias por interesarte en <strong>Transformación Digital</strong>.
          Para garantizar que solo personas realmente interesadas reciban este
          contenido y proteger tu privacidad, necesitamos confirmar tu email.
        </Text>

        <Section style={{ margin: '15px 0', textAlign: 'left' }}>
          <Row>
            <Column style={{ width: '28px', verticalAlign: 'middle' }}>
              <Img
                src="https://cdn.jsdelivr.net/gh/google/material-design-icons@master/png/action/check_circle/materialicons/24dp/2x/baseline_check_circle_black_24dp.png"
                width="20"
                height="20"
                alt="✅"
                style={{ display: 'block' }}
              />
            </Column>
            <Column style={{ verticalAlign: 'middle' }}>
              <Text
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#1D0033',
                }}
              >
                Al confirmar recibirás:
              </Text>
            </Column>
          </Row>
        </Section>

        <Section style={{ margin: '0 0 25px 0', textAlign: 'left' }}>
          <Row style={{ marginBottom: '12px' }}>
            <Column
              style={{ width: '30px', verticalAlign: 'top', paddingTop: '2px' }}
            >
              <Img
                src="https://cdn.jsdelivr.net/gh/google/material-design-icons@master/png/navigation/chevron_right/materialicons/24dp/2x/baseline_chevron_right_black_24dp.png"
                width="18"
                height="18"
                alt="•"
                style={{ display: 'block' }}
              />
            </Column>
            <Column>
              <Text style={{ margin: 0, fontSize: '15px', color: '#1D0033' }}>
                Análisis prácticos para digitalizar sin dependencia
              </Text>
            </Column>
          </Row>
          <Row style={{ marginBottom: '12px' }}>
            <Column
              style={{ width: '30px', verticalAlign: 'top', paddingTop: '2px' }}
            >
              <Img
                src="https://cdn.jsdelivr.net/gh/google/material-design-icons@master/png/navigation/chevron_right/materialicons/24dp/2x/baseline_chevron_right_black_24dp.png"
                width="18"
                height="18"
                alt="•"
                style={{ display: 'block' }}
              />
            </Column>
            <Column>
              <Text style={{ margin: 0, fontSize: '15px', color: '#1D0033' }}>
                Acceso prioritario a guías y plantillas del método CTP
              </Text>
            </Column>
          </Row>
          <Row>
            <Column
              style={{ width: '30px', verticalAlign: 'top', paddingTop: '2px' }}
            >
              <Img
                src="https://cdn.jsdelivr.net/gh/google/material-design-icons@master/png/navigation/chevron_right/materialicons/24dp/2x/baseline_chevron_right_black_24dp.png"
                width="18"
                height="18"
                alt="•"
                style={{ display: 'block' }}
              />
            </Column>
            <Column>
              <Text style={{ margin: 0, fontSize: '15px', color: '#1D0033' }}>
                Contenido que prioriza el control sobre tus procesos y datos
              </Text>
            </Column>
          </Row>
        </Section>

        <div style={{ marginTop: '30px' }}>
          <Button
            href={confirmationUrl}
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
            Confirmar mi Suscripción
          </Button>
        </div>

        <Text
          style={{
            marginTop: '20px',
            fontSize: '13px',
            color: '#64748b',
            lineHeight: 1.4,
            textAlign: 'center',
          }}
        >
          <em>
            ¿El botón no funciona? Copia y pega este enlace en tu navegador:
          </em>
          <br />
          <a
            href={confirmationUrl}
            style={{ color: '#FF0080', textDecoration: 'none' }}
          >
            {confirmationUrl}
          </a>
        </Text>

        <Section
          style={{
            marginTop: '25px',
            background: '#f8fafc',
            borderRadius: '6px',
            padding: '12px 15px',
            border: '1px solid #E2E8F0',
          }}
        >
          <Row>
            <Column style={{ width: '28px', verticalAlign: 'middle' }}>
              <Img
                src="https://cdn.jsdelivr.net/gh/google/material-design-icons@master/png/alert/warning/materialicons/24dp/2x/baseline_warning_black_24dp.png"
                width="18"
                height="18"
                alt="⚠️"
                style={{ display: 'block' }}
              />
            </Column>
            <Column style={{ verticalAlign: 'middle' }}>
              <Text
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: '#64748b',
                  lineHeight: 1.4,
                }}
              >
                <strong>Importante:</strong> Este enlace expira en 48 horas por
                seguridad. Si no confirmas, tu suscripción quedará pendiente.
              </Text>
            </Column>
          </Row>
        </Section>

        <Text
          style={{
            marginTop: '20px',
            fontSize: '13px',
            color: '#64748b',
            lineHeight: '1.4',
            textAlign: 'left',
          }}
        >
          ¿No fuiste tú quien se suscribió? Simplemente ignora este correo. No
          recibirás nada más y tu privacidad será respetada — es parte de la
          soberanía digital que defendemos.
        </Text>
      </Section>
    </EmailLayout>
  )
}

SubscriberDoubleOptIn.PreviewProps = {
  subscriberName: 'Carlos',
  confirmationUrl:
    'https://gabrielzavando.cl/confirm-subscription?token=abc123xyz',
  previewText: 'Confirma tu suscripción para recibir contenido estratégico',
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

export default SubscriberDoubleOptIn
