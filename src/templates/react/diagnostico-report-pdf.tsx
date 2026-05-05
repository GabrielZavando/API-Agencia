import * as React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from '@react-pdf/renderer'
import { DiagnosticoReportPdfProps } from './interfaces/diagnostic.interfaces'

// Colores del Diseño Premium
const colors = {
  primary: '#471761', // Púrpura principal
  secondary: '#FF0080', // Rosa vibrante
  dark: '#1D0033', // Púrpura oscuro / Negro
  muted: '#475569', // Gris texto
  bgLight: '#F8FAFC', // Fondo suave
  white: '#FFFFFF',
  border: '#E2E8F0',
  // Estatus
  alta: '#ECFDF5',
  altaText: '#059669',
  media: '#FFFBEB',
  mediaText: '#D97706',
  critico: '#FEF2F2',
  criticoText: '#DC2626',
  regular: '#F1F5F9',
  regularText: '#475569',
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: colors.white,
    fontFamily: 'Helvetica',
    color: colors.dark,
  },
  // --- Nuevo Header Estilo Email ---
  topBanner: {
    backgroundColor: colors.primary,
    padding: '30 40',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 45,
    height: 45,
    marginRight: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.white,
    opacity: 0.9,
    fontWeight: 'normal',
  },
  // --- Contenido ---
  container: {
    padding: '20 40 40 40',
  },
  topLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    paddingLeft: 40,
    paddingTop: 20,
  },
  headerInfo: {
    flexDirection: 'row',
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 15,
    justifyContent: 'space-between',
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.dark,
  },
  // --- Caja Resumen ---
  summaryBox: {
    width: '100%',
    backgroundColor: colors.dark,
    padding: 20,
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  summaryLeft: {
    width: '30%',
  },
  summaryRight: {
    width: '65%',
  },
  summaryLabel: {
    fontSize: 8,
    color: colors.white,
    opacity: 0.7,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  scoreTotal: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginLeft: 4,
  },
  nivelBadge: {
    backgroundColor: colors.secondary,
    padding: '4 8',
    alignSelf: 'flex-start',
  },
  nivelText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
  },
  summaryDescription: {
    fontSize: 9,
    color: colors.white,
    lineHeight: 1.5,
    opacity: 0.9,
  },
  // --- Sección Cita ---
  quoteSection: {
    marginBottom: 35,
    padding: '15 20',
    backgroundColor: colors.bgLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 1.4,
    color: colors.dark,
    marginBottom: 5,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  // --- Secciones Generales ---
  fullWidthSection: {
    width: '100%',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
    color: colors.dark,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  // --- Tabla de Pilares ---
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    padding: '8 10',
  },
  tableHeaderText: {
    fontSize: 11,
    color: colors.white,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: '8 10',
    alignItems: 'center',
  },
  colPilar: { width: '60%' },
  colScore: { width: '20%' },
  colStatus: { width: '20%', alignItems: 'flex-end' },
  pilarName: { fontSize: 9, fontWeight: 'bold' },
  pilarScore: { fontSize: 9, color: colors.muted },
  statusBadge: {
    padding: '3 6',
    borderRadius: 2,
  },
  statusText: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  // --- Riesgos ---
  risksSection: {
    backgroundColor: colors.bgLight,
    padding: 20,
    width: '100%',
  },
  riskItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  riskIcon: {
    backgroundColor: colors.secondary,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riskContent: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  riskDesc: {
    fontSize: 8,
    color: colors.muted,
    lineHeight: 1.4,
  },
  // --- Foco Crítico ---
  focoCriticoBox: {
    backgroundColor: colors.primary,
    padding: 20,
    position: 'relative',
    width: '100%',
  },
  focoTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.white,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  focoText: {
    fontSize: 9,
    color: colors.white,
    lineHeight: 1.6,
    opacity: 0.9,
  },
  lupaContainer: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    opacity: 0.1,
  },
  // --- Plan de Acción ---
  planSection: {
    backgroundColor: colors.bgLight,
    padding: 20,
    width: '100%',
  },
  planSubTitle: {
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  actionNumber: {
    backgroundColor: colors.dark,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  actionNumberText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 8,
    color: colors.muted,
    lineHeight: 1.4,
  },
  // --- CTA Final ---
  ctaSection: {
    marginTop: 40,
    padding: 30,
    backgroundColor: colors.dark,
    alignItems: 'center',
    borderRadius: 2,
  },
  ctaText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubText: {
    color: colors.white,
    opacity: 0.8,
    fontSize: 9,
    marginBottom: 20,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: colors.secondary,
    padding: '12 25',
    textDecoration: 'none',
  },
  ctaButtonText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
})

// Lupa Icon Component
const LupaIcon = () => (
  <View style={{ width: 40, height: 40, position: 'relative' }}>
    <View
      style={{
        width: 25,
        height: 25,
        borderWidth: 4,
        borderColor: colors.white,
        borderRadius: 12.5,
      }}
    />
    <View
      style={{
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 15,
        height: 4,
        backgroundColor: colors.white,
        transform: 'rotate(45deg)',
      }}
    />
  </View>
)

export const DiagnosticoReportPdf = (props: DiagnosticoReportPdfProps) => {
  const {
    nombre_completo,
    industria,
    fecha,
    score,
    nivel_label,
    situacion_actual_text,
    mensaje_clave_text,
    pillarScores,
    badge_cultura,
    badge_estrategia,
    badge_procesos,
    badge_datos,
    badge_tecnologia,
    riesgos,
    foco_critico_text,
    plan_de_accion_top3,
    consultor_nombre,
    year,
  } = props

  const logoUrl =
    'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/src/assets/img/logo-medium.png'

  return (
    <Document title={`Diagnóstico Digital - ${nombre_completo}`}>
      <Page size="A4" style={styles.page}>
        {/* Etiqueta superior opcional fuera del banner para estilo Dossier */}
        <Text style={styles.topLabel}>
          Diagnóstico de Madurez Digital {year}
        </Text>

        {/* 1. HEADER ESTILO EMAIL (BANNER PÚRPURA) */}
        <View style={styles.topBanner}>
          <Image src={logoUrl} style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Transformación Digital</Text>
            <Text style={styles.headerSubtitle}>
              Gabriel Zavando | Consultor Estratégico & Desarrollador Full Stack
            </Text>
          </View>
        </View>

        <View style={styles.container}>
          {/* Info Blocks Secundarios */}
          <View style={styles.headerInfo}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>CONSULTOR ESTRATÉGICO</Text>
              <Text style={styles.infoValue}>{consultor_nombre}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>SECTOR</Text>
              <Text style={styles.infoValue}>{industria}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>EMPRESA / CLIENTE</Text>
              <Text style={styles.infoValue}>{nombre_completo}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>FECHA DE EMISIÓN</Text>
              <Text style={styles.infoValue}>{fecha}</Text>
            </View>
          </View>

          {/* 2. RESUMEN DEL DIAGNOSTICO */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryLabel}>PUNTAJE OBTENIDO</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>{score}</Text>
                <Text style={styles.scoreTotal}>/ 15 PUNTOS</Text>
              </View>
              <View style={styles.nivelBadge}>
                <Text style={styles.nivelText}>NIVEL: {nivel_label}</Text>
              </View>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryLabel}>SITUACIÓN ACTUAL</Text>
              <Text style={styles.summaryDescription}>
                {situacion_actual_text}
              </Text>
            </View>
          </View>

          {/* 3. PERSPECTIVA ESTRATÉGICA (QUOTE) */}
          <View style={styles.quoteSection}>
            <Text style={styles.quoteText}>"{mensaje_clave_text}"</Text>
            <Text style={styles.quoteAuthor}>— PERSPECTIVA ESTRATÉGICA</Text>
          </View>

          {/* 4. PUNTAJES POR PILAR */}
          <View style={styles.fullWidthSection}>
            <Text style={styles.sectionTitle}>
              1. Análisis por Pilares Estratégicos
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colPilar]}>
                  PILAR ESTRATÉGICO
                </Text>
                <Text style={[styles.tableHeaderText, styles.colScore]}>
                  PUNTAJE
                </Text>
                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colStatus,
                    { textAlign: 'right' },
                  ]}
                >
                  ESTATUS
                </Text>
              </View>

              {[
                {
                  name: 'Cultura',
                  score: pillarScores.cultura,
                  badge: badge_cultura,
                },
                {
                  name: 'Estrategia',
                  score: pillarScores.estrategia,
                  badge: badge_estrategia,
                },
                {
                  name: 'Procesos',
                  score: pillarScores.procesos,
                  badge: badge_procesos,
                },
                {
                  name: 'Datos',
                  score: pillarScores.datos,
                  badge: badge_datos,
                },
                {
                  name: 'Tecnología',
                  score: pillarScores.tecnologia,
                  badge: badge_tecnologia,
                },
              ].map((p, i) => (
                <View key={i} style={styles.tableRow}>
                  <View style={styles.colPilar}>
                    <Text style={styles.pilarName}>{p.name}</Text>
                  </View>
                  <View style={styles.colScore}>
                    <Text style={styles.pilarScore}>{p.score}/3</Text>
                  </View>
                  <View style={styles.colStatus}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            colors[p.badge.class as keyof typeof colors] ||
                            colors.regular,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              colors[
                                `${p.badge.class}Text` as keyof typeof colors
                              ] || colors.muted,
                          },
                        ]}
                      >
                        {p.badge.label}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 5. RIESGOS IDENTIFICADOS */}
          <View break style={[styles.fullWidthSection, { marginTop: 32 }]}>
            <Text style={styles.sectionTitle}>
              2. Riesgos Críticos Identificados
            </Text>
            <View style={styles.risksSection}>
              {riesgos.slice(0, 3).map((r, i) => (
                <View key={i} style={styles.riskItem}>
                  <View style={styles.riskIcon}>
                    <Text
                      style={{
                        color: colors.white,
                        fontSize: 8,
                        fontWeight: 'bold',
                      }}
                    >
                      0{i + 1}
                    </Text>
                  </View>
                  <View style={styles.riskContent}>
                    <Text style={styles.riskTitle}>{r.titulo}</Text>
                    <Text style={styles.riskDesc}>{r.consecuencia}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 6. FOCO CRÍTICO */}
          <View style={styles.fullWidthSection}>
            <Text style={styles.sectionTitle}>3. Enfoque de Mejora</Text>
            <View style={styles.focoCriticoBox}>
              <Text style={styles.focoTitle}>FOCO CRÍTICO</Text>
              <Text style={styles.focoText}>{foco_critico_text}</Text>
              <View style={styles.lupaContainer}>
                <LupaIcon />
              </View>
            </View>
          </View>

          {/* 7. PLAN DE ACCIÓN */}
          <View style={styles.fullWidthSection}>
            <Text style={styles.sectionTitle}>4. Hoja de Ruta Táctica</Text>
            <View style={styles.planSection}>
              <Text style={styles.planSubTitle}>
                PRÓXIMOS 3 PASOS RECOMENDADOS
              </Text>
              {plan_de_accion_top3.map((p, i) => (
                <View key={i} style={styles.actionItem}>
                  <View style={styles.actionNumber}>
                    <Text style={styles.actionNumberText}>0{i + 1}</Text>
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>{p.titulo}</Text>
                    <Text style={styles.actionDesc}>{p.descripcion_breve}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 8. CTA FINAL */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaText}>
              ¿Listo para dar el siguiente paso?
            </Text>
            <Text style={styles.ctaSubText}>
              Agenda una asesoría online gratuita de 30 minutos para analizar tu
              caso y diseñar tu ruta de implementación.
            </Text>
            <Link
              src="https://calendly.com/gabrielzavando/30min"
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>
                AGENDAR SESIÓN ESTRATÉGICA
              </Text>
            </Link>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default DiagnosticoReportPdf
