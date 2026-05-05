import { Button, Section, Text, Heading, Img } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { DiagnosticoResultadoProps } from './interfaces/diagnostic.interfaces'

export const DiagnosticoResultado = (props: DiagnosticoResultadoProps) => {
  const {
    nombreCompleto,
    nivel,
    nivelEmoji,
    situacionActualText,
    scheduleUrl,
    ...layoutProps
  } = props

  const iconMap: Record<string, string> = {
    '🌱': 'https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/places/spa/materialicons/24dp/2x/baseline_spa_black_24dp.png',
    '🌿': 'https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/action/eco/materialicons/24dp/2x/baseline_eco_black_24dp.png',
    '🌳': 'https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/image/nature/materialicons/24dp/2x/baseline_nature_black_24dp.png',
  }
  const iconUrl =
    iconMap[nivelEmoji] ||
    'https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/editor/analytics/materialicons/24dp/2x/baseline_analytics_black_24dp.png'

  return (
    <EmailLayout {...layoutProps}>
      <Section>
        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: '#471761',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '11px',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          Análisis de Madurez Digital
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
          Tus Resultados están Listos
        </Heading>
        <Text style={{ fontSize: '16px', margin: '0 0 15px 0' }}>
          Hola <strong>{nombreCompleto}</strong>,
        </Text>
        <Text style={{ fontSize: '16px', margin: '0 0 15px 0' }}>
          Gracias por completar el formulario de diagnóstico. He analizado tus
          respuestas y generado un informe técnico que detalla tu nivel actual
          de madurez tecnológica y las áreas clave de oportunidad.
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
          <table role="presentation" cellSpacing="0" cellPadding="0" border={0}>
            <tr>
              <td style={{ verticalAlign: 'middle' }}>
                <Text
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#1D0033',
                  }}
                >
                  Nivel Detectado: {nivel}
                </Text>
              </td>
              <td style={{ verticalAlign: 'middle', paddingLeft: '8px' }}>
                <Img
                  src={iconUrl}
                  width="24"
                  height="24"
                  alt={nivelEmoji}
                  style={{ display: 'block' }}
                />
              </td>
            </tr>
          </table>
          <Text
            style={{
              margin: '10px 0 0 0',
              fontSize: '14px',
              color: '#475569',
              fontStyle: 'italic',
            }}
          >
            "{situacionActualText}"
          </Text>
        </Section>

        <Text style={{ fontSize: '16px', margin: '0 0 15px 0' }}>
          Adjunto a este correo encontrarás el informe detallado en formato PDF.
          Te recomiendo revisarlo con calma para planificar los siguientes pasos
          de tu transformación digital.
        </Text>

        <Text style={{ fontSize: '16px', margin: '0 0 25px 0' }}>
          Si quieres convertir estos hallazgos en acción, agenda una sesión de
          30 min (gratuita y sin compromiso). Analizaremos tu caso y veremos si
          mi método CTP es tu mejor ruta.
        </Text>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <Button
            href={scheduleUrl}
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
            Agendar ahora
          </Button>
        </div>
      </Section>
    </EmailLayout>
  )
}

DiagnosticoResultado.PreviewProps = {
  nombreCompleto: 'Pablo Torres',
  score: 8,
  nivel: 'Brote',
  nivelEmoji: '🌱',
  situacionActualText:
    'Tu empresa tiene una base digital pero aún hay procesos manuales.',
  scheduleUrl: 'https://calendly.com/gabrielzavando/30min',
  websiteUrl: 'https://gabrielzavando.cl',
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

export default DiagnosticoResultado
