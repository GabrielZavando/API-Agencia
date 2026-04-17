import { Injectable, Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import * as Handlebars from 'handlebars'
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
      'diagnostico',
      'templates',
      'report.hbs.html',
    )

    let templateSource = ''
    try {
      templateSource = fs.readFileSync(templatePath, 'utf8')
    } catch (e: unknown) {
      const error = e as Error
      this.logger.error(
        'No se pudo leer la plantilla report.hbs.html: ' + error.message,
      )
      throw e
    }

    // Compilar el template HTML con Handlebars
    const template = Handlebars.compile(templateSource)
    const html = template({
      ...context,
      calendlyUrl: companyConfig.calendlyUrl,
    })

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
        `PDF generado para ${context.nombre_completo || 'Usuario'} ` +
          `— Nivel ${context.nivel || 'N/A'}`,
      )
      return Buffer.from(pdfUint8Array)
    } finally {
      if (browser) await browser.close()
    }
  }
}
