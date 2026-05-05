import {
  DiagnosticAccion,
  DiagnosticRiesgo,
} from '../../diagnostico/resolver.service'

export interface PillarScores {
  cultura: number
  estrategia: number
  procesos: number
  datos: number
  tecnologia: number
}

export interface DiagnosticAccionConBreve extends DiagnosticAccion {
  descripcion_breve: string
}

export interface PdfContext {
  // Datos Base
  nombre_completo: string
  empresa: string
  industria: string
  fecha: string
  id_diagnostico: string
  score: number
  nivel: string
  nivel_color: string
  version: string
  // Contenido Enriquecido
  situacion_actual_text: string
  mensaje_clave_text: string
  impacto_industria_text: string
  riesgos: DiagnosticRiesgo[]
  pilar_critico: string
  pilar_critico_descripcion: string
  plan_de_accion: DiagnosticAccion[]
  resumen_foco_critico: string
  // Visuals & Badges
  nivel_label: string
  nivel_class: string
  badge_cultura: { label: string; class: string }
  badge_estrategia: { label: string; class: string }
  badge_procesos: { label: string; class: string }
  badge_datos: { label: string; class: string }
  badge_tecnologia: { label: string; class: string }
  plan_de_accion_top3: DiagnosticAccionConBreve[]
  foco_critico_text: string
  consultor_nombre: string
  sector_label: string
  year: string

  pillarScores: PillarScores
}
