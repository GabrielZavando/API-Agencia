import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AIProvider, AIContext } from '../interfaces/ai.interface';

@Injectable()
export class OpenAIProvider implements AIProvider {
  name = 'OpenAI GPT';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateResponse(prompt: string, context?: AIContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      const completion = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'Error generando respuesta';
    } catch (error) {
      console.error('Error en OpenAI:', error);
      throw new Error('Error generando respuesta con OpenAI');
    }
  }

  private buildSystemPrompt(context?: AIContext): string {
    if (!context) {
      return 'Eres un asistente que ayuda a responder consultas de prospectos de manera profesional y amigable.';
    }

    const { companyInfo, isReturningProspect, prospectName } = context;
    
    return `Eres un asistente de atención al cliente para ${companyInfo.name}.

INFORMACIÓN DE LA EMPRESA:
- Nombre: ${companyInfo.name}
- Descripción: ${companyInfo.description}
- Servicios: ${companyInfo.services.join(', ')}
- Valores: ${companyInfo.values.join(', ')}
- Tono de comunicación: ${companyInfo.tone}

CONTEXTO DEL PROSPECTO:
- Nombre: ${prospectName}
- ${isReturningProspect ? 'Cliente recurrente (dale prioridad y menciona que aprecias su regreso)' : 'Nuevo prospecto (dale una cálida bienvenida)'}

INSTRUCCIONES:
1. Responde de manera ${companyInfo.tone} y profesional
2. Agradece genuinamente su contacto
3. Muestra interés real en su consulta
4. ${isReturningProspect ? 'Reconoce que ya han interactuado antes' : 'Preséntate brevemente'}
5. Ofrece ayuda específica relacionada con nuestros servicios
6. Mantén un tono ${companyInfo.tone} pero siempre profesional
7. Invita a continuar la conversación
8. La respuesta debe ser entre 150-300 palabras
9. No uses saludo, ya que será parte de una plantilla HTML

Genera una respuesta personalizada que conecte emocionalmente con el prospecto.`;
  }
}
