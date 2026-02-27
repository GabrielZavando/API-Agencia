import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  FirebaseAuthGuard,
  AuthenticatedRequest,
} from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('projects')
@UseGuards(FirebaseAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('admin')
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get('my')
  @Roles('client')
  findMyProjects(@Req() req: AuthenticatedRequest) {
    return this.projectsService.findAllByClient(req.user!.uid);
  }

  @Get('client/:clientId')
  @Roles('admin')
  findAllByClient(@Param('clientId') clientId: string) {
    return this.projectsService.findAllByClient(clientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
