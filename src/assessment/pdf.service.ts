import { Injectable, Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import * as Handlebars from 'handlebars'
import { marked } from 'marked'
import { companyConfig } from '../config/company.config'
import { PuppeteerBrowser } from './interfaces/pdf.interface'

import pptr from 'puppeteer'

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name)

  async generateDiagnosisPdf(context: Record<string, any>): Promise<Buffer> {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'assessment',
      'templates',
      'report.hbs.md',
    )
    let markdownTemplate = ''
    try {
      markdownTemplate = fs.readFileSync(templatePath, 'utf8')
    } catch (e: unknown) {
      const error = e as Error
      this.logger.error(
        'No se pudo leer la plantilla report.hbs.md: ' + error.message,
      )
      throw e
    }

    // 1. Compilar variables con Handlebars
    const template = Handlebars.compile(markdownTemplate)
    const compiledMarkdown = template({
      ...context,
      calendlyUrl: companyConfig.calendlyUrl,
    })

    // 2. Transformar Markdown a HTML
    const htmlBody = await marked.parse(compiledMarkdown)

    // 3. Generar HTML completo con estilos FLAT
    const html = this.buildHtml(htmlBody, context)

    let browser: PuppeteerBrowser | null = null
    try {
      browser = await pptr.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      })

      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      })

      this.logger.log(
        `PDF dinámico generado para ${context.nombre_completo || 'Usuario'} — Nivel ${context.nivel || 'N/A'}`,
      )
      return Buffer.from(pdfUint8Array)
    } finally {
      if (browser) await browser.close()
    }
  }

  private buildHtml(bodyHtml: string, context: Record<string, any>): string {
    const primaryColor = (context.nivel_color as string) || '#ff007f'

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: Inter, Arial, sans-serif;
    background: #f9fafb;
    color: #111827;
  }

  /* RESET MARKED DEFAULT STYLES AND APPLY 100% FLAT STYLES */
  
  /* PREVENT CONTENT FROM SPLITTING ACROSS PDF PAGES */
  h1, h2, h3, p, li, blockquote, table, tr, img {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  h1, h2, h3 {
    page-break-after: avoid;
    break-after: avoid;
  }

  .page-container {
    padding: 48px;
    background: #f9fafb;
  }
  
  .header-logo {
    display: block;
    width: 80px;
    height: auto;
    margin-bottom: 32px;
  }
  
  h1 {
    font-size: 42px; font-weight: 900; line-height: 1.1; margin-bottom: 24px; text-transform: uppercase;
    background: #1D0033; color: #ffffff; padding: 24px; border: 4px solid #FF0080;
  }

  h2 {
    font-size: 28px; font-weight: 900; color: #1D0033; margin-top: 48px; margin-bottom: 24px; text-transform: uppercase;
    border-bottom: 4px solid #1D0033; padding-bottom: 8px;
  }

  h3 {
    font-size: 20px; font-weight: 800; color: #1D0033; margin-top: 32px; margin-bottom: 16px; text-transform: uppercase;
  }

  p { margin-bottom: 16px; line-height: 1.6; font-size: 16px; font-weight: 500; }
  
  ul, ol { margin-bottom: 24px; padding-left: 24px; line-height: 1.6; font-size: 16px; font-weight: 500; }
  li { margin-bottom: 8px; }

  blockquote {
    background: #ffffff; border: 4px solid #1D0033;
    border-left: 12px solid ${primaryColor};
    padding: 24px; margin-bottom: 32px;
    font-style: italic; font-weight: 600;
  }

  strong { font-weight: 900; color: #1D0033; }

  table {
    width: 100%; border-collapse: collapse; margin-bottom: 32px;
    border: 3px solid #1D0033; background: #ffffff;
  }
  
  th, td { border: 2px solid #1D0033; padding: 12px 16px; text-align: left; }
  th { background: #1D0033; color: #ffffff; font-weight: 800; text-transform: uppercase; }

  hr { border: none; border-top: 4px dashed #1D0033; margin: 48px 0; }

</style>
</head>
<body>
  <div class="page-container">
    <img src="https://gabrielzavando.cl/favicon.svg" alt="Gabriel Zavando Logo" class="header-logo" />
    ${bodyHtml}
  </div>
</body>
</html>`
  }
}
