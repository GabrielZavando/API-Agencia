import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import {
  FirebaseAuthGuard,
  AuthenticatedRequest,
} from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('ideas')
@UseGuards(FirebaseAuthGuard)
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post()
  @Roles('client', 'admin')
  @UseInterceptors(FileInterceptor('image'))
  createIdea(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateIdeaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const clientId = req.user!.uid;
    return this.ideasService.createIdea(dto, clientId, file);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.ideasService.findAll();
  }

  @Get('my-ideas')
  @Roles('client')
  findMyIdeas(@Req() req: AuthenticatedRequest) {
    return this.ideasService.findByClient(req.user!.uid);
  }
}
