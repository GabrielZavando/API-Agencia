import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { IdeasService } from './ideas.service'
import { CreateIdeaDto } from './dto/create-idea.dto'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'
import { AuthRequest } from '../common/interfaces/auth.interface'
import { Roles } from '../auth/roles.decorator'
import { IdeaResponseDto } from './dto/idea-response.dto'

@Controller('ideas')
@UseGuards(FirebaseAuthGuard)
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post()
  @Roles('client', 'admin')
  @UseInterceptors(FileInterceptor('image'))
  async createIdea(
    @Req() req: AuthRequest,
    @Body() dto: CreateIdeaDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IdeaResponseDto> {
    const clientId = req.user.uid
    return this.ideasService.createIdea(dto, clientId, file)
  }

  @Get()
  @Roles('admin')
  async findAll(): Promise<IdeaResponseDto[]> {
    return this.ideasService.findAll()
  }

  @Get('my-ideas')
  @Roles('client')
  async findMyIdeas(@Req() req: AuthRequest): Promise<IdeaResponseDto[]> {
    return this.ideasService.findByClient(req.user.uid)
  }
}
