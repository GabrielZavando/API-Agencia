import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AssessmentService } from './assessment.service'
import type { FirebaseService } from '../firebase/firebase.service'
import type { MailService } from '../mail/mail.service'
import type { PdfService } from './pdf.service'
import type { ResolverService } from './resolver.service'

// ── Mocks ─────────────────────────────────────────────────────
const mockFirebaseService = {
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        id: 'test-id-123',
        set: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue({
          data: () => ({ id: 'test-id-123' }),
        }),
      })),
    })),
  })),
}

const mockMailService = {
  getBaseVariables: vi.fn().mockResolvedValue({ siteName: 'Test' }),
  sendMail: vi.fn().mockResolvedValue(true),
}

const mockPdfService = {
  generateDiagnosisPdf: vi.fn().mockResolvedValue(Buffer.from('pdf')),
}

const mockResolverService = {
  resolveContext: vi.fn().mockReturnValue({ score: 0, nivel: 'semilla' }),
}

// ── Suite ─────────────────────────────────────────────────────
describe('AssessmentService', () => {
  let service: AssessmentService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new AssessmentService(
      mockFirebaseService as unknown as FirebaseService,
      mockMailService as unknown as MailService,
      mockPdfService as unknown as PdfService,
      mockResolverService as unknown as ResolverService,
    )
  })

  it('debe estar definido', () => {
    expect(service).toBeDefined()
  })

  // ── calculateScore ─────────────────────────────────────────
  describe('calculateScore', () => {
    it('debe devolver 0 cuando todas las respuestas son false', () => {
      const answers: boolean[] = new Array(12).fill(false) as boolean[]
      expect(service.calculateScore(answers)).toBe(0)
    })

    it('debe devolver 12 cuando todas las respuestas son true', () => {
      const answers: boolean[] = new Array(12).fill(true) as boolean[]
      expect(service.calculateScore(answers)).toBe(12)
    })
  })

  // ── getLevel ───────────────────────────────────────────────
  describe('getLevel', () => {
    it.each([
      [0, 'semilla'],
      [4, 'semilla'],
      [5, 'brote'],
      [8, 'brote'],
      [9, 'arbol'],
      [12, 'arbol'],
    ] as [number, string][])('score %i → nivel "%s"', (score, expected) => {
      expect(service.getLevel(score)).toBe(expected)
    })
  })

  // ── getPillarScores ────────────────────────────────────────
  describe('getPillarScores', () => {
    it('debe calcular correctamente el puntaje por pilar (3 preguntas cada uno)', () => {
      const answers: boolean[] = [
        true,
        true,
        false, // personas: 2
        true,
        false,
        false, // procesos: 1
        true,
        true,
        true, // tecnologia: 3
        false,
        false,
        false, // datos: 0
      ]
      const pillar = service.getPillarScores(answers)
      expect(pillar).toEqual({
        personas: 2,
        procesos: 1,
        tecnologia: 3,
        datos: 0,
      })
    })
  })
})
