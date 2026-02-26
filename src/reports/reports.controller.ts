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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import {
  FirebaseAuthGuard,
  AuthenticatedRequest,
} from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reports')
@UseGuards(FirebaseAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** Solo Admin: subir informe para un cliente */
  @Post()
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  uploadReport(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.uploadReport(file, dto);
  }

  /** Admin: listar todos / Cliente: listar los suyos */
  @Get()
  @Roles('admin', 'client')
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('clientId') clientId?: string,
  ) {
    if (req.user?.role === 'client') {
      return this.reportsService.findByClient(req.user.uid);
    }
    if (clientId) {
      return this.reportsService.findByClient(clientId);
    }
    return this.reportsService.findAll();
  }

  /** Admin/Client: obtener URL de descarga */
  @Get(':id/download')
  @Roles('admin', 'client')
  getDownloadUrl(@Param('id') id: string) {
    return this.reportsService.getDownloadUrl(id);
  }

  /** Solo Admin: eliminar informe */
  @Delete(':id')
  @Roles('admin')
  deleteReport(@Param('id') id: string) {
    return this.reportsService.deleteReport(id);
  }
}
