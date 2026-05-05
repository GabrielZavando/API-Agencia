import { Section, Text, Heading, Button, Img } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

import { ReportDeliveryProps } from './interfaces/diagnostic.interfaces'

export const ReportDelivery = (props: ReportDeliveryProps) => {
  const {
    clientName,
    reportTitle,
    reportProject,
    reportDescription,
    websiteUrl,
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
        <Heading
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '24px',
            color: '#1D0033',
            marginBottom: '20px',
            fontWeight: 700,
            marginTop: 0,
          }}
        >
          <Img
            src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/action/description/materialicons/24dp/2x/baseline_description_black_24dp.png"
            width="24"
            height="24"
            style={iconStyle}
          />
          Nuevo Informe Disponible
        </Heading>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Hola <strong>{clientName}</strong>,
        </Text>
        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Se ha generado y cargado un nuevo informe estratégico en tu panel de
          control que ya puedes revisar.
        </Text>

        <Section
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '25px',
            margin: '25px 0',
            borderLeft: '4px solid #1D0033',
          }}
        >
          <Text style={{ margin: 0, fontSize: '15px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/action/label/materialicons/24dp/2x/baseline_label_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Título:</strong> {reportTitle}
          </Text>
          <Text style={{ margin: '8px 0 0 0', fontSize: '15px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/file/folder/materialicons/24dp/2x/baseline_folder_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <strong>Proyecto:</strong> {reportProject}
          </Text>
          <Text
            style={{
              margin: '15px 0 0 0',
              fontSize: '14px',
              color: '#475569',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
          >
            "{reportDescription}"
          </Text>
        </Section>

        <Text
          style={{ color: '#64748b', fontSize: '14px', margin: '0 0 15px 0' }}
        >
          He adjuntado una copia en PDF a este correo para tu comodidad, pero
          recomiendo acceder siempre desde el dashboard para ver el histórico
          completo:
        </Text>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Button
            href={`${websiteUrl}/dashboard/informes`}
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
            Acceder al Dashboard
          </Button>
        </div>
      </Section>
    </EmailLayout>
  )
}

ReportDelivery.PreviewProps = {
  clientName: 'Pablo Torres',
  reportTitle: 'Informe de Desempeño Q1 2024',
  reportProject: 'Rebranding Agencia Digital',
  reportDescription:
    'Análisis detallado del impacto de las nuevas automatizaciones en el embudo de ventas durante el primer trimestre.',
  websiteUrl: 'https://gabrielzavando.cl',
  previewText: 'Nuevo Informe Disponible',
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

export default ReportDelivery
