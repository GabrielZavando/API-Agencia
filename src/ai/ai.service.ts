import { Injectable } from '@nestjs/common';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { GeminiProvider } from './providers/gemini.provider';
import {
  AIProvider,
  AIContext,
  AIProviderType,
  AIResponse,
  CompanyInfo,
} from './interfaces/ai.interface';
import { ContactDto } from '../forms/dto/contact.dto';
import { ProspectRecord } from '../firebase/firebase.service';

@Injectable()
export class AIService {
  private providers: Map<AIProviderType, AIProvider> = new Map();
  private defaultProvider: AIProviderType;

  constructor(
    private openAIProvider: OpenAIProvider,
    private claudeProvider: ClaudeProvider,
    private geminiProvider: GeminiProvider,
  ) {
    // Registrar proveedores
    this.providers.set(AIProviderType.OPENAI, this.openAIProvider);
    this.providers.set(AIProviderType.CLAUDE, this.claudeProvider);
    this.providers.set(AIProviderType.GEMINI, this.geminiProvider);

    // Establecer proveedor por defecto basado en variable de entorno
    this.defaultProvider = this.getDefaultProvider();
  }

  async generateProspectResponse(
    contactDto: ContactDto,
    existingProspect?: ProspectRecord,
    providerType?: AIProviderType,
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const provider = this.getProvider(providerType || this.defaultProvider);

    try {
      const context = this.buildAIContext(contactDto, existingProspect);
      const prompt = this.buildPrompt(contactDto, existingProspect);

      const content = await provider.generateResponse(prompt, context);
      const processingTime = Date.now() - startTime;

      return {
        content,
        provider: providerType || this.defaultProvider,
        processingTime,
      };
    } catch (error) {
      console.error(`Error con proveedor ${provider.name}:`, error);

      // Fallback a otro proveedor si falla el principal
      if (providerType !== this.defaultProvider) {
        console.log('Intentando con proveedor por defecto...');
        return this.generateProspectResponse(
          contactDto,
          existingProspect,
          this.defaultProvider,
        );
      }

      // Si el proveedor por defecto falla, devolver respuesta genérica
      return {
        content: this.getGenericResponse(contactDto, !!existingProspect),
        provider: providerType || this.defaultProvider,
        processingTime: Date.now() - startTime,
      };
    }
  }

  private getProvider(type: AIProviderType): AIProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Proveedor de IA no encontrado: ${type}`);
    }
    return provider;
  }

  private getDefaultProvider(): AIProviderType {
    const defaultProvider = process.env.DEFAULT_AI_PROVIDER as AIProviderType;

    if (
      defaultProvider &&
      Object.values(AIProviderType).includes(defaultProvider)
    ) {
      return defaultProvider;
    }

    // Fallback: verificar qué API keys están disponibles
    if (process.env.OPENAI_API_KEY) return AIProviderType.OPENAI;
    if (process.env.ANTHROPIC_API_KEY) return AIProviderType.CLAUDE;
    if (process.env.GOOGLE_AI_API_KEY) return AIProviderType.GEMINI;

    // Fallback final
    return AIProviderType.OPENAI;
  }

  private buildAIContext(
    contactDto: ContactDto,
    existingProspect?: ProspectRecord,
  ): AIContext {
    const companyInfo: CompanyInfo = {
      name: process.env.COMPANY_NAME || 'Tu Empresa',
      description:
        process.env.COMPANY_DESCRIPTION ||
        'Empresa líder en soluciones innovadoras',
      services: (
        process.env.COMPANY_SERVICES || 'consultoría,desarrollo,soporte'
      ).split(','),
      values: (
        process.env.COMPANY_VALUES || 'calidad,innovación,confianza'
      ).split(','),
      tone: (process.env.COMPANY_TONE as CompanyInfo['tone']) || 'professional',
    };

    return {
      prospectName: contactDto.name,
      prospectEmail: contactDto.email,
      message: contactDto.message,
      isReturningProspect: !!existingProspect,
      previousConversations:
        this.extractConversationSummaries(existingProspect),
      companyInfo,
    };
  }

  private buildPrompt(
    contactDto: ContactDto,
    existingProspect?: ProspectRecord,
  ): string {
    let prompt = `Consulta: "${contactDto.message}"`;

    if (existingProspect && existingProspect.conversations.length > 0) {
      const lastConversation =
        existingProspect.conversations[
          existingProspect.conversations.length - 1
        ];
      prompt += `\n\nÚltima interacción: "${lastConversation.incomingMessage.content}"`;
    }

    return prompt;
  }

  private extractConversationSummaries(prospect?: ProspectRecord): any[] {
    if (!prospect || !prospect.conversations) return [];

    return prospect.conversations.slice(-3).map((conv) => ({
      date: conv.timestamp.toString(),
      topic: this.extractTopic(conv.incomingMessage.content),
      summary: conv.incomingMessage.content.substring(0, 100) + '...',
    }));
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
    ];
    const foundKeyword = keywords.find((keyword) =>
      message.toLowerCase().includes(keyword),
    );

    return foundKeyword || 'consulta general';
  }

  private getGenericResponse(
    contactDto: ContactDto,
    isReturning: boolean,
  ): string {
    if (isReturning) {
      return `Hola ${contactDto.name}, he recibido tu nuevo mensaje y te responderé con prioridad en un plazo máximo de 12 horas.`;
    } else {
      return `Hola ${contactDto.name}, he recibido tu mensaje y te responderé en un plazo máximo de 24 horas.`;
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
      phone: '', // Agregar campo phone vacío
      message: testMessage,
      meta: {
        userAgent: 'test',
        page: '/test',
        ts: new Date().toISOString(),
      },
    };

    return this.generateProspectResponse(
      mockContactDto,
      undefined,
      providerType,
    );
  }
}
