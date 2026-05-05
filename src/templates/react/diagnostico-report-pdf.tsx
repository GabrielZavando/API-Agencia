import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { DiagnosticoReportPdfProps } from './interfaces/diagnostic.interfaces'

const colors = {
  primary: '#471761',
  secondary: '#FF0080',
  textMain: '#1D0033',
  textMuted: '#475569',
  background: '#F8FAFC',
  white: '#FFFFFF',
  border: '#1D0033',
  eco: '#22c55e',
  nature: '#f59e0b',
  forest: '#ef4444',
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: colors.background,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    borderBottomWidth: 4,
    borderBottomColor: colors.primary,
    paddingBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textMain,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    backgroundColor: colors.primary,
    padding: 10,
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5,
    color: colors.textMain,
    marginBottom: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  resultBox: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  pillarsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pillarBox: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 15,
    marginBottom: 15,
  },
  pillarName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  pillarScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textMain,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 10,
    color: colors.textMuted,
  },
})

export const DiagnosticoReportPdf = ({
  nombre_completo,
  industria,
  fecha,
  score,
  nivel,
  situacion_actual_text,
  pillarScores,
}: DiagnosticoReportPdfProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Diagnóstico Digital</Text>
            <Text style={styles.subtitle}>Análisis de Madurez Tecnológica</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.text}>
            <Text style={styles.bold}>Cliente:</Text> {nombre_completo}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Empresa/Industria:</Text> {industria}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Fecha:</Text> {fecha}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de Resultados</Text>
          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Puntaje Total:</Text>
              <Text style={styles.resultValue}>{score} / 12</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Nivel de Madurez:</Text>
              <Text style={styles.resultValue}>{nivel.toUpperCase()}</Text>
            </View>
            {situacion_actual_text && (
              <Text
                style={[styles.text, { marginTop: 10, fontStyle: 'italic' }]}
              >
                "{situacion_actual_text}"
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análisis por Pilares</Text>
          <View style={styles.pillarsContainer}>
            <View style={styles.pillarBox}>
              <Text style={styles.pillarName}>Personas</Text>
              <Text style={styles.pillarScore}>
                {pillarScores.personas} / 3
              </Text>
            </View>
            <View style={styles.pillarBox}>
              <Text style={styles.pillarName}>Procesos</Text>
              <Text style={styles.pillarScore}>
                {pillarScores.procesos} / 3
              </Text>
            </View>
            <View style={styles.pillarBox}>
              <Text style={styles.pillarName}>Tecnología</Text>
              <Text style={styles.pillarScore}>
                {pillarScores.tecnologia} / 3
              </Text>
            </View>
            <View style={styles.pillarBox}>
              <Text style={styles.pillarName}>Datos</Text>
              <Text style={styles.pillarScore}>{pillarScores.datos} / 3</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Siguientes Pasos</Text>
          <Text style={styles.text}>
            Te recomendamos agendar una sesión estratégica gratuita para revisar
            estos resultados en detalle y diseñar una hoja de ruta personalizada
            para tu transformación digital.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Gabriel Zavando | Agencia Digital - {new Date().getFullYear()}
          </Text>
          <Text style={styles.footerText}>
            https://gabrielzavando.cl | Generado automáticamente
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default DiagnosticoReportPdf
