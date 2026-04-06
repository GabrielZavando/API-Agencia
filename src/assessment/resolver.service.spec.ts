import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ResolverService } from './resolver.service'
import { PillarName } from './interfaces/assessment.interface'

describe('ResolverService', () => {
  let service: ResolverService

  beforeEach(() => {
    service = new ResolverService()
  })

  describe('getCriticalPillar', () => {
    it('debe identificar el pilar con menor puntaje', () => {
      const scores: Record<PillarName, number> = {
        personas: 3,
        procesos: 2,
        tecnologia: 1,
        datos: 2,
      }
      expect(service.getCriticalPillar(scores)).toBe('tecnologia')
    })

    it('debe desempatar por prioridad (Personas > Procesos)', () => {
      const scores: Record<PillarName, number> = {
        personas: 1,
        procesos: 1,
        tecnologia: 3,
        datos: 3,
      }
      // Prioridad: personas: 1, procesos: 2
      expect(service.getCriticalPillar(scores)).toBe('personas')
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
      const pillarScores = { personas: 0, procesos: 3, tecnologia: 3, datos: 3 }
      const dynamicVars = { nombre_completo: 'Test' }

      // Mock getDiagnosticContent para evitar lectura de archivos en tests unitarios
      vi.spyOn(service, 'getDiagnosticContent').mockReturnValue({
        custom: 'val',
      })

      const context = service.resolveContext(
        level,
        sector,
        pillarScores,
        dynamicVars,
      )

      expect(context.pilar_critico).toBe('personas')
      expect(context.estado_personas).toBe('Crítico')
      expect(context.custom).toBe('val')
      expect(context.nombre_completo).toBe('Test')
    })
  })
})
