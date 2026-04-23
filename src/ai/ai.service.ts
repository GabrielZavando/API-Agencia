import { Injectable } from '@nestjs/common'
import { OpenAIProvider } from './providers/openai.provider'
import { ClaudeProvider } from './providers/claude.provider'
import { GeminiProvider } from './providers/gemini.provider'
import {
  AIProvider,
  AIContext,
  AIProviderType,
  AIResponse,
  CompanyInfo,
  ConversationSummary,
} from './interfaces/ai.interface'
import { ContactDto } from '../forms/dto/contact.dto'
import { companyConfig } from '../config/company.config'
import {
  ContactoRecord,
  ConsultaRecord,
} from '../forms/interfaces/forms.interface'

interface ContactoWithConsultas extends ContactoRecord {
  recentConsultas?: ConsultaRecord[]
}

@Injectable()
export class AIService {
  private providers: Map<AIProviderType, AIProvider> = new Map()
  private defaultProvider: AIProviderType

  constructor(
    private openAIProvider: OpenAIProvider,
    private claudeProvider: ClaudeProvider,
    private geminiProvider: GeminiProvider,
  ) {
    // Registrar proveedores
    this.providers.set(AIProviderType.OPENAI, this.openAIProvider)
    this.providers.set(AIProviderType.CLAUDE, this.claudeProvider)
    this.providers.set(AIProviderType.GEMINI, this.geminiProvider)

    // Establecer proveedor por defecto basado en variable de entorno
    this.defaultProvider = this.getDefaultProvider()
  }

  async generateResponse(
    contactDto: ContactDto,
    existingContacto?: ContactoWithConsultas,
    providerType?: AIProviderType,
  ): Promise<AIResponse> {
    const startTime = Date.now()
    const provider = this.getProvider(providerType || this.defaultProvider)

    try {
      const context = this.buildAIContext(contactDto, existingContacto)
      const prompt = this.buildPrompt(contactDto, existingContacto)

      const content = await provider.generateResponse(prompt, context)
      const processingTime = Date.now() - startTime

      return {
        content,
        provider: providerType || this.defaultProvider,
        processingTime,
      }
    } catch (error) {
      console.error(`Error con proveedor ${provider.name}:`, error)

      // Fallback a otro proveedor si falla el principal
      if (providerType && providerType !== this.defaultProvider) {
        console.log('Intentando con proveedor por defecto...')
        return this.generateResponse(
          contactDto,
          existingContacto,
          this.defaultProvider,
        )
      }

      // Si el proveedor por defecto falla, devolver respuesta genérica
      return {
        content: this.getGenericResponse(contactDto, !!existingContacto),
        provider: providerType || this.defaultProvider,
        processingTime: Date.now() - startTime,
      }
    }
  }

  private getProvider(type: AIProviderType): AIProvider {
    const provider = this.providers.get(type)
    if (!provider) {
      throw new Error(`Proveedor de IA no encontrado: ${type}`)
    }
    return provider
  }

  private getDefaultProvider(): AIProviderType {
    const defaultProvider = process.env.DEFAULT_AI_PROVIDER as AIProviderType

    if (
      defaultProvider &&
      Object.values(AIProviderType).includes(defaultProvider)
    ) {
      return defaultProvider
    }

    // Fallback: verificar qué API keys están disponibles
    if (process.env.OPENAI_API_KEY) return AIProviderType.OPENAI
    if (process.env.ANTHROPIC_API_KEY) return AIProviderType.CLAUDE
    if (process.env.GOOGLE_AI_API_KEY) return AIProviderType.GEMINI

    // Fallback final
    return AIProviderType.OPENAI
  }

  private buildAIContext(
    contactDto: ContactDto,
    existingContacto?: ContactoWithConsultas,
  ): AIContext {
    const companyInfo: CompanyInfo = {
      name: companyConfig.name,
      description: companyConfig.description,
      services: companyConfig.services.split(','),
      values: companyConfig.values.split(','),
      tone: companyConfig.tone,
    }

    return {
      nombreContacto: contactDto.name,
      emailContacto: contactDto.email,
      message: contactDto.message,
      esContactoRecurrente: !!existingContacto,
      previousConversations:
        this.extractConversationSummaries(existingContacto),
      companyInfo,
    }
  }

  private buildPrompt(
    contactDto: ContactDto,
    existingContacto?: ContactoWithConsultas,
  ): string {
    let prompt = `Consulta: "${contactDto.message}"`

    if (
      existingContacto?.recentConsultas &&
      existingContacto.recentConsultas.length > 0
    ) {
      const lastConsulta =
        existingContacto.recentConsultas[
          existingContacto.recentConsultas.length - 1
        ]
      prompt += `\n\nÚltima interacción: "${lastConsulta.contenido}"`
    }

    return prompt
  }

  private extractConversationSummaries(
    contacto?: ContactoWithConsultas,
  ): ConversationSummary[] {
    if (!contacto?.recentConsultas) return []

    return contacto.recentConsultas.slice(-3).map((consulta) => ({
      date: this.formatConsultaDate(consulta.fecha),
      topic: this.extractTopic(consulta.contenido),
      summary: (consulta.contenido || '').substring(0, 100) + '...',
    }))
  }

  private formatConsultaDate(fecha: unknown): string {
    if (!fecha) return ''
    if (fecha instanceof Date) return fecha.toISOString()

    // Manejo de Timestamp de Firestore
    const timestamp = fecha as {
      toDate?: () => Date
      _seconds?: number
    }

    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString()
    }

    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toISOString()
    }

    return ''
  }

  private extractTopic(message: string): string {
    // Lógica simple para extraer tema principal
    const keywords = [
      'precio',
      'servicio',
      'consulta',
      'información',
      'cotización',
      'soporte',
    ]
    const foundKeyword = keywords.find((keyword) =>
      message.toLowerCase().includes(keyword),
    )

    return foundKeyword || 'consulta general'
  }

  private getGenericResponse(
    contactDto: ContactDto,
    isReturning: boolean,
  ): string {
    if (isReturning) {
      return `Hola ${contactDto.name}, he recibido tu nuevo mensaje y te responderé con prioridad en un plazo máximo de 12 horas.`
    } else {
      return `Hola ${contactDto.name}, he recibido tu mensaje y te responderé en un plazo máximo de 24 horas.`
    }
  }

  // Método para probar diferentes proveedores
  async testProvider(
    providerType: AIProviderType,
    testMessage: string,
  ): Promise<AIResponse> {
    const mockContactDto: ContactDto = {
      name: 'Test User',
      email: 'test@test.com',
      phone: '',
      message: testMessage,
      meta: {
        userAgent: 'test',
        page: '/test',
        ts: new Date().toISOString(),
      },
    }

    return this.generateResponse(mockContactDto, undefined, providerType)
  }
}
