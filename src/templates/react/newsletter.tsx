import { Section, Text, Heading, Img, Button } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { NewsletterProps } from './interfaces/subscriber.interfaces'

export const Newsletter = (props: NewsletterProps) => {
  const {
    subscriberName = 'ahí',
    postTitle,
    postImage,
    postExcerpt,
    postUrl,
    unsubscribeUrl,
    ...layoutProps
  } = props

  return (
    <EmailLayout {...layoutProps}>
      <Section>
        <div
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            background: '#EEF2FF',
            color: '#4338CA',
            fontWeight: 700,
            fontSize: '11px',
            textTransform: 'uppercase',
            marginBottom: '15px',
            letterSpacing: '0.5px',
          }}
        >
          Nueva Publicación
        </div>
        <Heading
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '24px',
            color: '#1D0033',
            marginBottom: '30px',
            fontWeight: 700,
            lineHeight: 1.3,
            marginTop: 0,
          }}
        >
          {postTitle}
        </Heading>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Hola, {subscriberName}:
        </Text>
        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          He publicado un nuevo artículo en mi blog que creo que te resultará de
          gran valor para tus estrategias digitales actuales.
        </Text>

        <Section
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            padding: 0,
            margin: '25px 0',
            overflow: 'hidden',
          }}
        >
          {postImage && (
            <Img
              src={postImage}
              alt={postTitle}
              width="100%"
              style={{ display: 'block' }}
            />
          )}
          <Section
            style={{
              padding: '25px',
              borderLeft: '4px solid #471761',
            }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: '14px',
                color: '#475569',
                lineHeight: 1.6,
              }}
            >
              {postExcerpt}
            </Text>
          </Section>
        </Section>

        <div style={{ textAlign: 'center', marginTop: '25px' }}>
          <Button
            href={postUrl}
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
            Leer Artículo Completo
          </Button>
        </div>

        <Text
          style={{
            fontSize: '11px',
            opacity: 0.5,
            marginTop: '30px',
            textAlign: 'center',
          }}
        >
          Recibiste este correo porque estás suscrito al boletín de Gabriel
          Zavando.{' '}
          <a
            href={unsubscribeUrl}
            style={{ color: '#1D0033', textDecoration: 'underline' }}
          >
            Darme de baja
          </a>
          .
        </Text>
      </Section>
    </EmailLayout>
  )
}

Newsletter.PreviewProps = {
  subscriberName: 'Carlos',
  postTitle: 'IA y Automatización: El Futuro de los Negocios Digitales',
  postImage:
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
  postExcerpt:
    'Descubre cómo las nuevas herramientas de inteligencia artificial están transformando la manera en que operamos y escalamos empresas digitales en 2024.',
  postUrl: 'https://gabrielzavando.cl/blog/ia-negocios-2024',
  unsubscribeUrl:
    'https://gabrielzavando.cl/unsubscribe?email=test@example.com',
  previewText: 'Nueva publicación: IA y Automatización',
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

export default Newsletter
