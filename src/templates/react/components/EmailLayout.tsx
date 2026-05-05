import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { EmailLayoutProps } from '../interfaces/email.interfaces'
import { SocialLinks } from './SocialLinks'

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  previewText,
  logoUrl,
  companyName,
  address,
  currentYear,
  social,
  children,
}) => {
  return (
    <Html lang="es">
      <Head />
      <Preview>{previewText}</Preview>
      <Body
        style={{
          fontFamily: "'Open Sans', Arial, sans-serif",
          lineHeight: '1.6',
          color: '#1D0033',
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#f9fafb',
          padding: '20px 0',
        }}
      >
        <Container
          style={{
            backgroundColor: '#ffffff',
            margin: '0 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          {/* Header */}
          <Section
            style={{
              background: '#471761',
              padding: '30px',
              textAlign: 'center',
              color: '#FFFFFF',
            }}
          >
            <table
              role="presentation"
              cellSpacing="0"
              cellPadding="0"
              border={0}
              align="center"
              style={{ margin: '0 auto' }}
            >
              <tr>
                <td align="center" valign="middle">
                  <Img
                    src={logoUrl}
                    alt={companyName}
                    width="50"
                    style={{ display: 'block', border: '0' }}
                  />
                </td>
                <td
                  align="left"
                  valign="middle"
                  style={{ paddingLeft: '20px' }}
                >
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      lineHeight: '1.2',
                    }}
                  >
                    Transformación Digital
                  </Text>
                  <Text
                    style={{
                      margin: '4px 0 0 0',
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#FFFFFF',
                      opacity: 0.9,
                      lineHeight: '1.2',
                    }}
                  >
                    Gabriel Zavando | Consultor Estratégico & Desarrollador Full
                    Stack
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Content */}
          <Section style={{ padding: '40px 30px' }}>{children}</Section>

          {/* Footer */}
          <Section
            style={{
              backgroundColor: '#1d0033',
              color: '#FFFFFF',
              textAlign: 'center',
              padding: '40px 30px',
              fontSize: '13px',
            }}
          >
            <SocialLinks {...social} />

            <Text
              style={{
                margin: '0 0 5px 0',
                fontWeight: 700,
                fontSize: '15px',
                color: '#FFFFFF',
              }}
            >
              Gabriel Zavando | Consultor Estratégico & Desarrollador Full Stack
            </Text>
            <Text
              style={{
                margin: 0,
                opacity: 0.8,
                color: '#FFFFFF',
                marginBottom: '25px',
              }}
            >
              {address}
              <br />
              <Link
                href="https://gabrielzavando.cl"
                style={{
                  color: '#FFFFFF',
                  textDecoration: 'underline',
                  fontSize: '13px',
                }}
              >
                gabrielzavando.cl
              </Link>
            </Text>

            <Hr
              style={{
                borderColor: 'rgba(255,255,255,0.1)',
                margin: '20px 0',
              }}
            />
            <Text
              style={{
                fontSize: '11px',
                opacity: 0.7,
                color: '#FFFFFF',
                fontWeight: 700,
              }}
            >
              © {currentYear} | Todos los derechos reservados.
              <br />
              Este es un mensaje institucional enviado por el sistema de Gabriel
              Zavando.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
