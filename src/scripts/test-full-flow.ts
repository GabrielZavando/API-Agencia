import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { DiagnosticoService } from '../diagnostico/diagnostico.service'
import { CrearDiagnosticoDto } from '../diagnostico/dto/crear-diagnostico.dto'

async function testFullFlow() {
  console.log('🚀 Iniciando test de flujo completo...')
  const app = await NestFactory.createApplicationContext(AppModule)
  const diagnosticoService = app.get(DiagnosticoService)

  const testDto: CrearDiagnosticoDto = {
    name: 'Gabriel Test Flow',
    email: 'gabrielzavando@gmail.com',
    industry: 'tecnologia',
    company: 'Agencia Digital Test',
    answers: [
      true,
      true,
      false, // Cultura
      true,
      false,
      true, // Estrategia
      true,
      true,
      true, // Procesos
      false,
      true,
      false, // Datos
      true,
      true,
      false, // Tecnologia
    ],
  }

  try {
    console.log('📝 Procesando diagnóstico y entrega...')
    const result = await diagnosticoService.processAndDeliver(testDto)
    console.log('✅ Proceso de DiagnosticoService finalizado.')
    console.log('Puntaje:', result.score)
    console.log('Nivel:', result.nivel)

    console.log(
      '\n⏳ Esperando 10 segundos para que se completen los procesos asíncronos (PDF y Email)...',
    )
    await new Promise((resolve) => setTimeout(resolve, 10000))

    console.log(
      '\n🏁 Test finalizado. Revisa si llegó el correo a gabrielzavando@gmail.com',
    )
  } catch (error) {
    console.error('💥 Error en el flujo:', error)
  } finally {
    await app.close()
  }
}

void testFullFlow()
