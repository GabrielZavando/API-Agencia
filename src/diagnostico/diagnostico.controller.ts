import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { DiagnosticoService } from './diagnostico.service'
import { CrearDiagnosticoDto } from './dto/crear-diagnostico.dto'
import { DiagnosticoRespuestaDto } from './dto/diagnostico-respuesta.dto'

@Controller('diagnostico')
export class DiagnosticoController {
  constructor(private readonly diagnosticoService: DiagnosticoService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(
    @Body() dto: CrearDiagnosticoDto,
  ): Promise<DiagnosticoRespuestaDto> {
    const diagnosis = await this.diagnosticoService.processAndDeliver(dto)

    return {
      success: true,
      diagnosis,
    }
  }

  @Post('process-queue')
  @HttpCode(HttpStatus.OK)
  async processQueue(): Promise<any> {
    const result = await this.diagnosticoService.processQueue()
    return {
      success: true,
      data: result,
    }
  }
}
