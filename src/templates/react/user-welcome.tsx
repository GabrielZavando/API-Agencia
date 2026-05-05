import { Section, Text, Heading, Button, Img } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'
import { UserWelcomeProps } from './interfaces/user.interfaces'

export const UserWelcome = (props: UserWelcomeProps) => {
  const { userName, userEmail, pass, role, websiteUrl, ...layoutProps } = props

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
            marginBottom: '25px',
            fontWeight: 700,
            marginTop: 0,
          }}
        >
          ¡Hola {userName}! 🎉
        </Heading>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Es un placer darte la bienvenida a nuestra plataforma de gestión
          digital. Ya tienes acceso a todas las herramientas necesarias para
          potenciar tu crecimiento.
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
          <Text style={{ margin: 0, fontSize: '16px' }}>
            <strong>Tu cuenta ha sido activada correctamente.</strong>
          </Text>
          <Text style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
            Usa las siguientes credenciales para iniciar sesión:
          </Text>
          <ul
            style={{
              margin: '15px 0 0 0',
              paddingLeft: '20px',
              fontSize: '14px',
            }}
          >
            <li>
              <b>Email:</b> {userEmail}
            </li>
            <li>
              <b>Contraseña Temporal:</b> {pass}
            </li>
            <li>
              <b>Rol Asignado:</b> {role}
            </li>
          </ul>
          <Text
            style={{ margin: '15px 0 0 0', fontSize: '12px', color: '#FF0080' }}
          >
            * Te recomiendo cambiar tu contraseña temporal una vez ingreses a la
            plataforma.
          </Text>
        </Section>

        <Text style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Desde tu panel personal podrás:
        </Text>

        <ul
          style={{
            padding: 0,
            margin: '25px 0',
            listStyle: 'none',
            fontSize: '14px',
            color: '#475569',
          }}
        >
          <li style={{ marginBottom: '15px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/action/assessment/materialicons/24dp/2x/baseline_assessment_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <b style={{ color: '#1D0033' }}>Recibir informes:</b> Acceso privado
            a todos tus informes.
          </li>
          <li style={{ marginBottom: '15px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/file/folder/materialicons/24dp/2x/baseline_folder_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <b style={{ color: '#1D0033' }}>Repositorio de Archivos:</b>{' '}
            Biblioteca de recursos multimedia para organizar tus archivos.
          </li>
          <li style={{ marginBottom: '15px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/communication/chat/materialicons/24dp/2x/baseline_chat_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <b style={{ color: '#1D0033' }}>Soporte Directo:</b> Canal
            prioritario para consultas y servicio técnico mediante tickets.
          </li>
          <li style={{ marginBottom: '15px' }}>
            <Img
              src="https://cdn.jsdelivr.net/gh/google/material-design-icons@4.0.0/png/action/build/materialicons/24dp/2x/baseline_build_black_24dp.png"
              width="18"
              height="18"
              style={iconStyle}
            />
            <b style={{ color: '#1D0033' }}>Herramientas exclusivas:</b> Acceso
            a herramientas gratuitas exclusivas para mis clientes.
          </li>
        </ul>

        <div style={{ textAlign: 'center', marginTop: '25px' }}>
          <Button
            href={`${websiteUrl}/login`}
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
            Acceder a mi Panel
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
          ¿Algún problema para ingresar? Responde a este correo para recibir
          ayuda.
        </Text>
      </Section>
    </EmailLayout>
  )
}

UserWelcome.PreviewProps = {
  userName: 'Pablo Torres',
  dashboardUrl: 'https://gabrielzavando.cl/dashboard',
  websiteUrl: 'https://gabrielzavando.cl',
  userEmail: 'pablo@ejemplo.cl',
  pass: 'XyZ123!@#',
  role: 'Cliente VIP',
  previewText: 'Bienvenido a la plataforma de Gabriel Zavando',
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

export default UserWelcome
