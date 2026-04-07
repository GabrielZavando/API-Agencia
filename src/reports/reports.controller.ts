import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ReportsService } from './reports.service'
import { CreateReportDto } from './dto/create-report.dto'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'
import { AuthRequest } from '../common/interfaces/auth.interface'
import { Roles } from '../auth/roles.decorator'
import { ReportResponseDto } from './dto/report-response.dto'

@Controller('reports')
@UseGuards(FirebaseAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** Solo Admin: subir informe para un cliente */
  @Post()
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadReport(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateReportDto,
  ): Promise<ReportResponseDto> {
    return this.reportsService.uploadReport(file, dto)
  }

  /** Admin: listar todos / Cliente: listar los suyos */
  @Get()
  @Roles('admin', 'client')
  async findAll(
    @Req() req: AuthRequest,
    @Query('clientId') clientId?: string,
  ): Promise<ReportResponseDto[]> {
    if (req.user.role === 'client') {
      return this.reportsService.findByClient(req.user.uid)
    }
    if (clientId) {
      return this.reportsService.findByClient(clientId)
    }
    return this.reportsService.findAll()
  }

  /** Admin/Client: obtener URL de descarga con verificación de propiedad */
  @Get(':id/download')
  @Roles('admin', 'client')
  async getDownloadUrl(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Query('download') download?: string,
  ): Promise<{ url: string; fileName: string }> {
    const isDownload = download === 'true'
    return this.reportsService.getDownloadUrl(id, req.user, isDownload)
  }

  /** Solo Admin: eliminar informe */
  @Delete(':id')
  @Roles('admin')
  async deleteReport(@Param('id') id: string): Promise<void> {
    return this.reportsService.deleteReport(id)
  }
}
