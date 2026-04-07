import { Injectable, Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import { PillarName } from './interfaces/assessment.interface'

@Injectable()
export class ResolverService {
  private readonly logger = new Logger(ResolverService.name)

  // Desempate: Personas > Procesos > Tecnología > Datos
  // El valor numérico representa la posición en el orden de prioridad (1 es la principal).
  private readonly PILLAR_PRIORITY: Record<PillarName, number> = {
    personas: 1,
    procesos: 2,
    tecnologia: 3,
    datos: 4,
  }

  getCriticalPillar(pillarScores: Record<PillarName, number>): PillarName {
    let criticalPillar: PillarName | null = null
    let minScore = Infinity

    for (const [pillar, score] of Object.entries(pillarScores)) {
      const p = pillar as PillarName
      if (score < minScore) {
        minScore = score
        criticalPillar = p
      } else if (score === minScore && criticalPillar) {
        // En caso de empate (mismo score bajo), elegimos el de mayor prioridad (valor numérico menor)
        if (this.PILLAR_PRIORITY[p] < this.PILLAR_PRIORITY[criticalPillar]) {
          criticalPillar = p
        }
      }
    }

    return criticalPillar || 'personas' // fallback seguro
  }

  private getPillarStatus(score: number): {
    estado: string
    prioridad: string
  } {
    if (score <= 1) return { estado: 'Crítico', prioridad: 'Alta' }
    if (score === 2) return { estado: 'Regular', prioridad: 'Media' }
    return { estado: 'Óptimo', prioridad: 'Baja' }
  }

  slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD') // divide acentos de la letra
      .replace(/[\u0300-\u036f]/g, '') // quita acentos
      .replace(/[^\w\s-]/g, '') // remueve no-alfanumérico salvo espacios
      .replace(/[\s_-]+/g, '-') // intercambia espacios o guiones múltiples por -
      .replace(/^-+|-+$/g, '') // recorta guiones extra
  }

  getDiagnosticContent(
    level: string,
    sector: string,
    pilar: PillarName,
  ): Record<string, any> {
    const levelSlug = this.slugify(level)
    const sectorSlug = this.slugify(sector)
    const pilarSlug = this.slugify(pilar)

    const fileName = `${levelSlug}-${sectorSlug}-${pilarSlug}.json`
    const filePath = path.join(
      process.cwd(),
      'src',
      'assessment',
      'data',
      fileName,
    )

    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(fileContent) as Record<string, any>
      } else {
        this.logger.warn(
          `JSON dinámico no encontrado: ${fileName}. Retornando objeto vacío.`,
        )
        // Retornamos default para no reventar la aplicación:
        return {}
      }
    } catch (e) {
      const error = e as Error
      this.logger.error(
        `Error leyendo json de diagnóstico ${fileName}: ${error.message}`,
      )
      return {}
    }
  }

  resolveContext(
    level: string,
    sector: string,
    pillarScores: Record<PillarName, number>,
    dynamicVars: Record<string, any>,
  ): Record<string, any> {
    const criticalPillar = this.getCriticalPillar(pillarScores)
    const jsonContent = this.getDiagnosticContent(level, sector, criticalPillar)

    const statusPersonas = this.getPillarStatus(pillarScores.personas)
    const statusProcesos = this.getPillarStatus(pillarScores.procesos)
    const statusTec = this.getPillarStatus(pillarScores.tecnologia)
    const statusDatos = this.getPillarStatus(pillarScores.datos)

    return {
      ...jsonContent,
      ...dynamicVars,
      pilar_critico: criticalPillar,
      estado_personas: statusPersonas.estado,
      prioridad_personas: statusPersonas.prioridad,
      estado_procesos: statusProcesos.estado,
      prioridad_procesos: statusProcesos.prioridad,
      estado_tecnologia: statusTec.estado,
      prioridad_tecnologia: statusTec.prioridad,
      estado_datos: statusDatos.estado,
      prioridad_datos: statusDatos.prioridad,
    }
  }
}
