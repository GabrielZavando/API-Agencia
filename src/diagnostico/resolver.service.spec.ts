import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ResolverService } from './resolver.service'
import { NombrePilar } from './interfaces/diagnostico.interface'

describe('ResolverService', () => {
  let service: ResolverService

  beforeEach(() => {
    service = new ResolverService()
  })

  describe('getCriticalPillar', () => {
    it('debe identificar el pilar con menor puntaje', () => {
      const scores: Record<NombrePilar, number> = {
        cultura: 3,
        procesos: 2,
        tecnologia: 1,
        datos: 2,
        estrategia: 3,
      }
      expect(service.getCriticalPillar(scores)).toBe('tecnologia')
    })

    it('debe desempatar por prioridad (Cultura > Estrategia)', () => {
      const scores: Record<NombrePilar, number> = {
        cultura: 1,
        estrategia: 1,
        procesos: 3,
        tecnologia: 3,
        datos: 3,
      }
      // Prioridad: cultura: 1, estrategia: 2
      expect(service.getCriticalPillar(scores)).toBe('cultura')
    })
  })

  describe('slugify', () => {
    it('debe normalizar textos para nombres de archivos', () => {
      expect(service.slugify('Árbol Genealógico!')).toBe('arbol-genealogico')
      expect(service.slugify('Tecnología y Datos')).toBe('tecnologia-y-datos')
    })
  })

  describe('resolveContext', () => {
    it('debe ensamblar el contexto correctamente', () => {
      const level = 'semilla'
      const sector = 'Salud'
      const pillarScores: Record<NombrePilar, number> = {
        cultura: 0,
        estrategia: 3,
        procesos: 3,
        tecnologia: 3,
        datos: 3,
      }
      const dynamicVars = { nombre_completo: 'Test' }

      // Mock getDiagnosticContentMaster para evitar lectura de archivos en tests unitarios
      vi.spyOn(service, 'getDiagnosticContentMaster').mockReturnValue({
        capa_nivel: {},
        capa_sector: {},
        capa_dimension_critica: {},
      })

      const context = service.resolveContext(
        level,
        sector,
        pillarScores,
        dynamicVars,
      )

      expect(context.pilar_critico).toBe('cultura')
      expect(context.estado_cultura).toBe('Crítico')
      expect(context.nombre_completo).toBe('Test')
    })
  })
})
