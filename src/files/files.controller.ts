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
import {
  FirebaseAuthGuard,
  AuthenticatedRequest,
} from '../auth/firebase-auth.guard'
import { Roles } from '../auth/roles.decorator'

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
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) throw new Error('User not authenticated')
    const uid = req.user.uid
    const role = (req.user.role as 'admin' | 'client') || 'client'
    return await this.filesService.uploadFile(file, dto, uid, role)
  }

  /** Listar archivos propios */
  @Get()
  @Roles('admin', 'client')
  async findAll(@Req() req: AuthenticatedRequest) {
    if (!req.user) throw new Error('User not authenticated')
    const uid = req.user.uid
    // Todos los usuarios (admins o clientes) solo ven sus propios archivos
    return await this.filesService.findByOwner(uid)
  }

  /** Cuota de almacenamiento */
  @Get('storage/quota')
  @Roles('admin', 'client')
  async getQuota(@Req() req: AuthenticatedRequest) {
    if (!req.user) throw new Error('User not authenticated')
    const uid = req.user.uid
    const role = (req.user.role as 'admin' | 'client') || 'client'
    return await this.filesService.getStorageQuota(uid, role)
  }

  /** Admin: obtener cuota de almacenamiento de un usuario específico */
  @Get('storage/quota/:uid')
  @Roles('admin')
  async getUserQuota(@Param('uid') uid: string) {
    // Al ser admin consultando a otro, asumimos que es un cliente para aplicar su límite
    // O podríamos buscar su rol real en la DB. Por simplicidad, usamos 'client'
    // ya que el admin suele tener cuota fija.
    return await this.filesService.getStorageQuota(uid, 'client')
  }

  /** URL de descarga */
  @Get(':id/download')
  @Roles('admin', 'client')
  async download(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Query('download') download?: string,
  ) {
    if (!req.user) throw new Error('User not authenticated')
    const uid = req.user.uid
    const isDownload = download === 'true'
    // Download solo permite archivos propios
    return await this.filesService.getDownloadUrl(id, uid, isDownload)
  }

  /** Eliminar archivo */
  @Delete(':id')
  @Roles('admin', 'client')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (!req.user) throw new Error('User not authenticated')
    const uid = req.user.uid
    // Delete solo permite archivos propios
    return await this.filesService.deleteFile(id, uid)
  }
}
