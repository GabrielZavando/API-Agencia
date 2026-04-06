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
import { FilesService } from './files.service'
import { UploadFileDto } from './dto/upload-file.dto'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'
import { AuthRequest } from '../common/interfaces/auth.interface'
import { Roles } from '../auth/roles.decorator'
import { FileResponseDto, StorageQuotaDto } from './dto/file-response.dto'

@Controller('files')
@UseGuards(FirebaseAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /** Subir archivo (admin o cliente) */
  @Post()
  @Roles('admin', 'client')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Req() req: AuthRequest,
  ): Promise<FileResponseDto> {
    const uid = req.user.uid
    const role = (req.user.role as 'admin' | 'client') || 'client'
    return this.filesService.uploadFile(file, dto, uid, role)
  }

  /** Listar archivos propios */
  @Get()
  @Roles('admin', 'client')
  async findAll(@Req() req: AuthRequest): Promise<FileResponseDto[]> {
    const uid = req.user.uid
    // Todos los usuarios (admins o clientes) solo ven sus propios archivos
    return this.filesService.findByOwner(uid)
  }

  /** Cuota de almacenamiento */
  @Get('storage/quota')
  @Roles('admin', 'client')
  async getQuota(@Req() req: AuthRequest): Promise<StorageQuotaDto> {
    const uid = req.user.uid
    const role = (req.user.role as 'admin' | 'client') || 'client'
    return this.filesService.getStorageQuota(uid, role)
  }

  /** Admin: obtener cuota de almacenamiento de un usuario específico */
  @Get('storage/quota/:uid')
  @Roles('admin')
  async getUserQuota(@Param('uid') uid: string): Promise<StorageQuotaDto> {
    // Al ser admin consultando a otro, asumimos que es un cliente para aplicar su límite
    return this.filesService.getStorageQuota(uid, 'client')
  }

  /** URL de descarga */
  @Get(':id/download')
  @Roles('admin', 'client')
  async download(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Query('download') download?: string,
  ): Promise<{ url: string; fileName: string }> {
    const uid = req.user.uid
    const isDownload = download === 'true'
    // Download solo permite archivos propios
    return this.filesService.getDownloadUrl(id, uid, isDownload)
  }

  /** Eliminar archivo */
  @Delete(':id')
  @Roles('admin', 'client')
  async remove(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<void> {
    const uid = req.user.uid
    // Delete solo permite archivos propios
    return this.filesService.deleteFile(id, uid)
  }
}
