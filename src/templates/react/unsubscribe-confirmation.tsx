import { Section, Text, Heading } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { UnsubscribeConfirmationProps } from './interfaces/subscriber.interfaces'

export const UnsubscribeConfirmation = (
  props: UnsubscribeConfirmationProps,
) => {
  const { subscriberName = 'ahí', ...layoutProps } = props

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
          Tu baja ha sido procesada
        </Heading>

        <Text
          style={{ margin: '0 0 15px 0', fontSize: '16px', textAlign: 'left' }}
        >
          Hola, {subscriberName}:
        </Text>
        <Text
          style={{ margin: '0 0 15px 0', fontSize: '16px', textAlign: 'left' }}
        >
          Este correo confirma que has sido dado de baja de nuestra lista de
          difusión. Ya no recibirás más boletines informativos ni correos
          masivos de nuestra parte.
        </Text>

        <Text
          style={{
            margin: '25px 0 15px 0',
            fontSize: '16px',
            textAlign: 'left',
          }}
        >
          Lamentamos verte partir, pero respetamos tu decisión. Si en el futuro
          decides volver a recibir nuestras actualizaciones, siempre serás
          bienvenido.
        </Text>

        <Text
          style={{
            marginTop: '35px',
            fontSize: '14px',
            color: '#64748b',
            fontStyle: 'italic',
            textAlign: 'left',
          }}
        >
          ¿Cometiste un error? Si no querías darte de baja, puedes volver a
          suscribirte en cualquier momento desde nuestro sitio web oficial.
        </Text>
      </Section>
    </EmailLayout>
  )
}

UnsubscribeConfirmation.PreviewProps = {
  subscriberName: 'Carlos',
  previewText: 'Tu baja ha sido procesada',
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

export default UnsubscribeConfirmation
