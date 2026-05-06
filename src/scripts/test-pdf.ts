import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { PdfService } from '../diagnostico/pdf.service'
import { ResolverService } from '../diagnostico/resolver.service'
import { PdfContext } from '../diagnostico/interfaces/diagnostico.interface'
import * as fs from 'fs'
import * as path from 'path'

async function generateTestPdf() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const pdfService = app.get(PdfService)
  const resolverService = app.get(ResolverService)

  console.log('🚀 Generando PDF de prueba...')

  // Datos de prueba (Mismo flujo que el servicio real)
  const mockPillarScores = {
    cultura: 2,
    estrategia: 3,
    procesos: 1,
    datos: 2,
    tecnologia: 1,
  }

  const mockDynamicVars = {
    nombre_completo: 'Usuario de Prueba',
    empresa: 'Agencia Digital Test',
    industria: 'Tecnología',
    fecha: '05 de mayo de 2026',
    id_diagnostico: 'TEST-12345',
    score: 9,
    nivel_color: '#f59e0b',
    nivel: 'brote',
    version: 'v3.0',
    pillarScores: mockPillarScores,
  }

  const context = resolverService.resolveContext(
    'brote',
    'Tecnología',
    mockPillarScores,
    mockDynamicVars as Record<string, unknown>,
  )

  const buffer = await pdfService.generateDiagnosisPdf(context)

  const outputPath = path.join(process.cwd(), 'test-diagnostico.pdf')
  fs.writeFileSync(outputPath, buffer)

  console.log(`✅ PDF generado exitosamente en: ${outputPath}`)
  await app.close()
}

generateTestPdf().catch((err: Error) => {
  console.error('❌ Error generando PDF:', err)
  process.exit(1)
})
