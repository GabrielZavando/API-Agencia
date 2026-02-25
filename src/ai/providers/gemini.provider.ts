import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIContext } from '../interfaces/ai.interface';

@Injectable()
export class GeminiProvider implements AIProvider {
  name = 'Google Gemini';
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
  }

  async generateResponse(prompt: string, context?: AIContext): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      });

      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nConsulta del prospecto: ${prompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;

      return response.text() || 'Error generando respuesta';
    } catch (error) {
      console.error('Error en Gemini:', error);
      throw new Error('Error generando respuesta con Gemini');
    }
  }

  private buildSystemPrompt(context?: AIContext): string {
    if (!context) {
      return 'Actúa como un experto en atención al cliente, respondiendo de manera profesional y orientada a soluciones.';
    }

    const { companyInfo, isReturningProspect, prospectName } = context;

    return `Eres el asistente virtual especializado en atención al cliente de ${companyInfo.name}.

DATOS DE LA ORGANIZACIÓN:
- Nombre: ${companyInfo.name}
- Propuesta de valor: ${companyInfo.description}
- Portfolio de servicios: ${companyInfo.services.join(', ')}
- Principios organizacionales: ${companyInfo.values.join(', ')}
- Personalidad de marca: ${companyInfo.tone}

PERFIL DEL INTERLOCUTOR:
- Nombre: ${prospectName}
- Clasificación: ${isReturningProspect ? 'Cliente establecido (priorizar y reconocer historial)' : 'Nuevo contacto (enfoque en generar confianza inicial)'}

PARÁMETROS DE COMUNICACIÓN:
- Mantén consistencia con el tono ${companyInfo.tone} de la marca
- Demuestra comprensión profunda de la consulta
- ${isReturningProspect ? 'Haz referencia sutil a la relación previa' : 'Construye rapport desde el primer intercambio'}
- Conecta naturalmente con nuestros servicios cuando sea apropiado
- Aporta insights valiosos más allá de la consulta básica
- Facilita el siguiente paso en la conversación
- Extensión ideal: 150-300 palabras
- Omite saludos iniciales (gestionados por template)

Crea una respuesta que posicione a la empresa como la solución ideal y motive la continuidad del diálogo.`;
  }
}
