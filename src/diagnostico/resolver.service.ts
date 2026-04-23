import { Injectable, Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import { NombrePilar } from './interfaces/diagnostico.interface'

export interface DiagnosticCapaNivel {
  titulo?: string
  situacion_actual_text?: string
  mensaje_clave_text?: string
}

export interface DiagnosticRiesgo {
  titulo: string
  consecuencia: string
}

export interface DiagnosticCapaSector {
  impacto_industria_text?: string
  riesgos?: DiagnosticRiesgo[]
}

export interface DiagnosticAccion {
  titulo: string
  pilar: string
  tiempo: string
  descripcion: string
}

export interface DiagnosticAccionConBreve extends DiagnosticAccion {
  descripcion_breve: string
}

export interface DiagnosticCapaDimension {
  nombre?: string
  descripcion?: string
  semilla?: DiagnosticAccion[]
  brote?: DiagnosticAccion[]
  arbol?: DiagnosticAccion[]
}

export interface DiagnosticContent {
  capa_nivel: Record<string, DiagnosticCapaNivel>
  capa_sector: Record<string, DiagnosticCapaSector>
  capa_dimension_critica: Record<string, DiagnosticCapaDimension>
}

@Injectable()
export class ResolverService {
  private readonly logger = new Logger(ResolverService.name)
  private readonly CONSULTOR_NOMBRE = 'Gabriel Zavando'

  // Desempate: Personas > Procesos > Tecnología > Datos
  // El valor numérico representa la posición en el orden de prioridad (1 es la principal).
  private readonly PILLAR_PRIORITY: Record<NombrePilar, number> = {
    cultura: 1,
    estrategia: 2,
    procesos: 3,
    datos: 4,
    tecnologia: 5,
  }

  getCriticalPillar(pillarScores: Record<NombrePilar, number>): NombrePilar {
    let criticalPillar: NombrePilar | null = null
    let minScore = Infinity

    for (const [pillar, score] of Object.entries(pillarScores)) {
      const p = pillar as NombrePilar
      if (score < minScore) {
        minScore = score
        criticalPillar = p
      } else if (score === minScore && criticalPillar) {
        // En caso de empate (mismo score bajo), elegimos el de mayor prioridad
        if (this.PILLAR_PRIORITY[p] < this.PILLAR_PRIORITY[criticalPillar]) {
          criticalPillar = p
        }
      }
    }

    return criticalPillar || 'cultura' // fallback seguro
  }

  private getPillarStatus(score: number): {
    estado: string
    prioridad: string
  } {
    if (score <= 1) return { estado: 'Crítico', prioridad: 'Alta' }
    if (score === 2) return { estado: 'Regular', prioridad: 'Media' }
    return { estado: 'Óptimo', prioridad: 'Baja' }
  }

  /**
   * Retorna el badge visual (label + color de fondo) para un pilar
   * en función de su puntaje (0–3).
   */
  private getPillarBadge(score: number): {
    label: string
    class: string
  } {
    if (score === 0) return { label: 'CRÍTICO', class: 'critico' }
    if (score === 1) return { label: 'INICIO', class: 'inicio' }
    if (score === 2) return { label: 'REGULAR', class: 'regular' }
    return { label: 'ALTA', class: 'alta' }
  }

  /**
   * Extrae solo el texto del bloque "Qué hacer" del markdown
   * enriquecido de las acciones. Fallback: primeros 160 chars limpios.
   */
  private extractBriefDescription(markdown: string): string {
    const match = markdown.match(
      /\*\*Qué hacer:\*\*\n([\s\S]+?)(?:\n\n|\*\*|$)/,
    )
    if (match?.[1]) return match[1].trim()
    return markdown
      .replace(/\*\*[^*]+\*\*\n?/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 160)
  }

  slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  getDiagnosticContentMaster(): DiagnosticContent {
    const filePath = path.join(
      process.cwd(),
      'src',
      'diagnostico',
      'data',
      'diagnostic-content.json',
    )

    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(fileContent) as DiagnosticContent
      } else {
        this.logger.warn(`Archivio central diagnostic-content.json no hallado.`)
        return { capa_nivel: {}, capa_sector: {}, capa_dimension_critica: {} }
      }
    } catch (e) {
      const error = e as Error
      this.logger.error(
        `Error leyendo json central diagnostic-content.json: ${error.message}`,
      )
      return { capa_nivel: {}, capa_sector: {}, capa_dimension_critica: {} }
    }
  }

  getArchetypeFromSector(sector: string): string {
    const s = this.slugify(sector)
    const map: Record<string, string> = {
      comercio: 'comercio_retail',
      'servicios-profesionales': 'servicios_b2b',
      'legal-y-contable': 'servicios_b2b',
      salud: 'salud_bienestar',
      'belleza-y-bienestar': 'salud_bienestar',
      gastronomia: 'hospitalidad_gastronomia',
      'turismo-y-hospedaje': 'hospitalidad_gastronomia',
      'construccion-e-inmobiliario': 'industrial_produccion',
      'manufactura-y-produccion': 'industrial_produccion',
      'agricultura-y-agroindustria': 'industrial_produccion',
      'transporte-y-logistica': 'industrial_produccion',
      'creativo-y-marketing': 'agencias_tecnologia',
      tecnologia: 'agencias_tecnologia',
      educacion: 'educacion',
      otros: 'otros',
    }
    return map[s] || 'otros'
  }

  resolveContext(
    level: string,
    sector: string,
    pillarScores: Record<NombrePilar, number>,
    dynamicVars: Record<string, unknown>,
  ): Record<string, unknown> {
    const dataMaster = this.getDiagnosticContentMaster()
    const criticalPillar = this.getCriticalPillar(pillarScores)
    const levelKey = level.toLowerCase()

    // 1. Capa Nivel
    const capaNivel = dataMaster.capa_nivel[levelKey] || {}

    // 2. Capa Sector
    const archetype = this.getArchetypeFromSector(sector)
    const capaSector =
      dataMaster.capa_sector[archetype] || dataMaster.capa_sector['otros'] || {}

    // 3. Capa Dimensión (Pilar crítico)
    const capaPilar = dataMaster.capa_dimension_critica[criticalPillar] || {}
    let accionesCriticas: DiagnosticAccion[] = []
    if (levelKey === 'semilla') accionesCriticas = capaPilar.semilla || []
    if (levelKey === 'brote') accionesCriticas = capaPilar.brote || []
    if (levelKey === 'arbol') accionesCriticas = capaPilar.arbol || []

    // Top 3 acciones con descripción breve para el PDF
    const plan_de_accion_top3: DiagnosticAccionConBreve[] = accionesCriticas
      .slice(0, 3)
      .map((accion) => ({
        ...accion,
        descripcion_breve: this.extractBriefDescription(accion.descripcion),
      }))

    // Textos del nivel para el badge del PDF
    const nivelLabels: Record<string, string> = {
      semilla: 'SEMILLA',
      brote: 'BROTE',
      arbol: 'ÁRBOL',
    }
    const nivel_class = levelKey

    // Foco crítico: combinación del pilar débil + contexto del sector
    const focoPilarNombre = capaPilar.nombre || criticalPillar
    const focoPilarDesc = capaPilar.descripcion || ''
    const focoSectorDesc = capaSector.impacto_industria_text || ''
    const foco_critico_text = (
      `Tu pilar más débil es ${focoPilarNombre}. ` +
      `${focoPilarDesc} ` +
      `${focoSectorDesc}`
    )
      .replace(/\s+/g, ' ')
      .trim()

    // Estados de los 5 pilares (legacy — se mantienen para compatibilidad)
    const statusCultura = this.getPillarStatus(pillarScores.cultura)
    const statusEstrategia = this.getPillarStatus(pillarScores.estrategia)
    const statusProcesos = this.getPillarStatus(pillarScores.procesos)
    const statusTec = this.getPillarStatus(pillarScores.tecnologia)
    const statusDatos = this.getPillarStatus(pillarScores.datos)

    // Sector formateado para mostrar en el PDF
    const sector_label =
      sector.charAt(0).toUpperCase() + sector.slice(1).replace(/-/g, ' ')

    return {
      // Variables Base
      ...dynamicVars,

      // Bloques Inyectados Nivel
      situacion_actual_text: capaNivel.situacion_actual_text || '',
      mensaje_clave_text: capaNivel.mensaje_clave_text || '',

      // Bloques Inyectados Sector
      impacto_industria_text: capaSector.impacto_industria_text || '',
      riesgos: capaSector.riesgos || [],

      // Bloques Inyectados Dimensión
      pilar_critico: capaPilar.nombre || criticalPillar,
      pilar_critico_descripcion: capaPilar.descripcion || '',
      plan_de_accion: accionesCriticas,
      resumen_foco_critico: capaSector.impacto_industria_text || '',

      // Estados de los 5 Pilares (legacy)
      estado_cultura: statusCultura.estado,
      prioridad_cultura: statusCultura.prioridad,
      estado_estrategia: statusEstrategia.estado,
      prioridad_estrategia: statusEstrategia.prioridad,
      estado_procesos: statusProcesos.estado,
      prioridad_procesos: statusProcesos.prioridad,
      estado_tecnologia: statusTec.estado,
      prioridad_tecnologia: statusTec.prioridad,
      estado_datos: statusDatos.estado,
      prioridad_datos: statusDatos.prioridad,

      // ── PDF Executive Dossier ──────────────────────────────────────
      nivel_label: nivelLabels[levelKey] ?? levelKey.toUpperCase(),
      nivel_class,
      badge_cultura: this.getPillarBadge(pillarScores.cultura),
      badge_estrategia: this.getPillarBadge(pillarScores.estrategia),
      badge_procesos: this.getPillarBadge(pillarScores.procesos),
      badge_datos: this.getPillarBadge(pillarScores.datos),
      badge_tecnologia: this.getPillarBadge(pillarScores.tecnologia),
      plan_de_accion_top3,
      foco_critico_text,
      consultor_nombre: this.CONSULTOR_NOMBRE,
      sector_label,
      year: new Date().getFullYear().toString(),
    }
  }
}
