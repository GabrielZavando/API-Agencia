import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplateService {
  private templatesPath: string;

  constructor() {
    // Detectar si estamos en desarrollo (src/) o producción (dist/)
    const isDev = __dirname.includes('/src/');
    
    if (isDev) {
      // Desarrollo: usar src/templates/email
      this.templatesPath = path.join(process.cwd(), 'src', 'templates', 'email');
    } else {
      // Producción: usar dist/templates/email (copiado durante build)
      this.templatesPath = path.join(__dirname, '..', 'templates', 'email');
    }
    
    console.log('📧 Ruta de plantillas configurada:', this.templatesPath);
    console.log('🔧 Modo:', isDev ? 'desarrollo' : 'producción');
  }

  async getEmailTemplate(templateName: string, variables: Record<string, any>): Promise<string> {
    try {
      // Inyectar logoUrl por defecto si no fue proporcionado
      if (!variables.logoUrl) {
        const base = process.env.BASE_URL || `http://localhost:${process.env.PORT ?? 3000}`;
        variables.logoUrl = `${base}/public/email-assets/logo-full.png`;
      }

      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      console.log('🔍 Buscando plantilla en:', templatePath);
      
      // Verificar si el archivo existe
      if (!fs.existsSync(templatePath)) {
        console.error('❌ Plantilla no encontrada:', templatePath);
        
        // Listar archivos disponibles para debug
        try {
          const availableFiles = fs.readdirSync(this.templatesPath);
          console.log('📁 Archivos disponibles en templates:', availableFiles);
        } catch (dirError) {
          console.error('❌ Error leyendo directorio de plantillas:', dirError);
        }
        
        throw new Error(`Plantilla no encontrada: ${templateName}.html`);
      }
      
      let template = fs.readFileSync(templatePath, 'utf8');
      console.log('✅ Plantilla cargada exitosamente');

      // Reemplazar variables en la plantilla (convertir a string para evitar undefined/null)
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const value = variables[key] === undefined || variables[key] === null ? '' : String(variables[key]);
        template = template.replace(regex, value);
      });

      return template;
    } catch (error) {
      console.error('Error cargando plantilla:', error);
      throw new Error(`Error cargando plantilla: ${templateName}`);
    }
  }
}
