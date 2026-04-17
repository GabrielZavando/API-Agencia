import { DiagnosticoService } from './diagnostico.service'
import { CrearDiagnosticoDto } from './dto/crear-diagnostico.dto'
import { FirebaseService } from '../firebase/firebase.service'
import { MailService } from '../mail/mail.service'
import { PdfService } from './pdf.service'
import { ResolverService } from './resolver.service'

const mockFirebaseService = {
  getDb: vi.fn(),
  saveContacto: vi.fn().mockResolvedValue('contacto-id'),
  addDiagnosticoToContacto: vi.fn().mockResolvedValue('diag-id'),
  addConsultaToContacto: vi.fn().mockResolvedValue('consulta-id'),
}

const mockMailService = {
  sendMail: vi.fn().mockResolvedValue(true),
  getBaseVariables: vi.fn().mockResolvedValue({}),
}

const mockPdfService = {
  generateDiagnosisPdf: vi.fn().mockResolvedValue(Buffer.from('pdf')),
}

const mockResolverService = {
  resolveContext: vi.fn((level, industry, pillarScores, vars) => ({
    ...vars,
    nivel: level,
    nivel_emoji: '🌱',
    situacion_actual_text: 'Texto de situación',
  })),
}

const mockDb = {
  collectionGroup: vi.fn(() => ({
    where: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
}

describe('DiagnosticoService', () => {
  let service: DiagnosticoService

  beforeEach(() => {
    vi.clearAllMocks()
    mockFirebaseService.getDb.mockReturnValue(mockDb)
    service = new DiagnosticoService(
      mockFirebaseService as unknown as FirebaseService,
      mockMailService as unknown as MailService,
      mockPdfService as unknown as PdfService,
      mockResolverService as unknown as ResolverService,
    )
  })

  describe('calculateScore', () => {
    it('debe contar correctamente las respuestas verdaderas', () => {
      // Arrange
      const answers = [
        true,
        false,
        true,
        true,
        false,
        false,
        true,
        false,
        true,
        true,
        false,
        false,
        true,
        false,
        true,
      ]

      // Act
      const score = service.calculateScore(answers)

      // Assert
      expect(score).toBe(8)
    })
  })

  describe('getLevel', () => {
    it('debe retornar "semilla" para score <= 5', () => {
      expect(service.getLevel(3)).toBe('semilla')
      expect(service.getLevel(5)).toBe('semilla')
    })

    it('debe retornar "brote" para score entre 6 y 10', () => {
      expect(service.getLevel(6)).toBe('brote')
      expect(service.getLevel(10)).toBe('brote')
    })

    it('debe retornar "arbol" para score > 10', () => {
      expect(service.getLevel(11)).toBe('arbol')
      expect(service.getLevel(15)).toBe('arbol')
    })
  })

  describe('getPillarScores', () => {
    it('debe calcular puntajes individuales por pilar correctamente', () => {
      // Arrange — 3 respuestas por pilar, todas verdaderas
      const answers: boolean[] = Array(15).fill(true)

      // Act
      const scores = service.getPillarScores(answers)

      // Assert
      expect(scores.cultura).toBe(3)
      expect(scores.estrategia).toBe(3)
      expect(scores.procesos).toBe(3)
      expect(scores.datos).toBe(3)
      expect(scores.tecnologia).toBe(3)
    })
  })

  describe('saveContactoAndDiagnostico', () => {
    it('debe guardar el contacto y el diagnóstico correctamente', async () => {
      // Arrange
      const dto: CrearDiagnosticoDto = {
        name: 'Ana López',
        email: 'ana@empresa.cl',
        industry: 'Retail',
        answers: Array(15).fill(false),
      }
      const context = {
        score: 0,
        nivel: 'semilla',
        nivel_emoji: '🌱',
        pillarScores: {
          cultura: 0,
          estrategia: 0,
          procesos: 0,
          datos: 0,
          tecnologia: 0,
        },
      }

      // Act
      await service.saveContactoAndDiagnostico(
        dto,
        context as Record<string, any>,
        'enviado',
      )

      // Assert
      expect(mockFirebaseService.saveContacto).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ana López',
          email: 'ana@empresa.cl',
          industria: 'Retail',
          origen: 'formulario_diagnostico',
        }),
      )
      expect(mockFirebaseService.addDiagnosticoToContacto).toHaveBeenCalledWith(
        'contacto-id',
        expect.objectContaining({
          respuestas: dto.answers,
          estado: 'enviado',
          contenido: context,
        }),
      )
      expect(mockFirebaseService.addConsultaToContacto).toHaveBeenCalled()
    })
  })

  describe('getDailySentCount', () => {
    it('debe retornar 0 sin diagnósticos enviados hoy', async () => {
      // Arrange + Act
      const count = await service.getDailySentCount()

      // Assert
      expect(count).toBe(0)
      expect(mockDb.collectionGroup).toHaveBeenCalledWith('diagnosticos')
    })
  })
})
