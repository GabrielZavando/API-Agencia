import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIContext } from '../interfaces/ai.interface';

@Injectable()
export class ClaudeProvider implements AIProvider {
  name = 'Anthropic Claude';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateResponse(prompt: string, context?: AIContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);

      const response = await this.client.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      return content.type === 'text'
        ? content.text
        : 'Error generando respuesta';
    } catch (error) {
      console.error('Error en Claude:', error);
      throw new Error('Error generando respuesta con Claude');
    }
  }

  private buildSystemPrompt(context?: AIContext): string {
    if (!context) {
      return 'Eres un asistente especializado en atención al cliente que responde de manera empática y profesional.';
    }

    const { companyInfo, isReturningProspect, prospectName } = context;

    return `Actúas como representante de atención al cliente de ${companyInfo.name}.

PERFIL DE LA EMPRESA:
- Empresa: ${companyInfo.name}
- Misión: ${companyInfo.description}
- Servicios principales: ${companyInfo.services.join(', ')}
- Valores corporativos: ${companyInfo.values.join(', ')}
- Estilo de comunicación: ${companyInfo.tone}

INFORMACIÓN DEL CONTACTO:
- Prospecto: ${prospectName}
- Tipo: ${isReturningProspect ? 'Cliente que regresa (valorar la relación previa)' : 'Primer contacto (crear buena primera impresión)'}

DIRECTRICES DE RESPUESTA:
- Adopta un tono ${companyInfo.tone} pero siempre cálido y profesional
- Demuestra empatía genuina hacia su consulta
- ${isReturningProspect ? 'Reconoce y agradece la confianza continua' : 'Establece una conexión inicial positiva'}
- Relaciona la respuesta con nuestros servicios cuando sea relevante
- Proporciona valor real en tu respuesta
- Extiende una invitación clara para continuar el diálogo
- Mantén la respuesta entre 150-300 palabras
- No incluyas saludo inicial (será manejado por la plantilla)

Tu objetivo es crear una respuesta que genere confianza y invite a profundizar la relación comercial.`;
  }
}
