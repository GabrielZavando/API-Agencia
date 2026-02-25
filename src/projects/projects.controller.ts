import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';

import { Project, User } from '../common/interfaces';

@Controller('projects')
@UseGuards(FirebaseAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('admin')
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  async findAll(@Request() req: { user: User }) {
    const user = req.user;

    // Si es admin, ve todos
    if (user.role === 'admin') {
      return this.projectsService.findAll();
    }

    // Si es cliente, solo ve los suyos
    if (user.role === 'client') {
      return this.projectsService.findByClient(user.uid);
    }

    throw new ForbiddenException('Invalid role');
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: { user: User }) {
    const project: Project = await this.projectsService.findOne(id);
    const user = req.user;

    // Verificar propiedad si es cliente
    if (user.role !== 'admin' && project.clientId !== user.uid) {
      throw new ForbiddenException(
        'You do not have permission to view this project',
      );
    }

    return project;
  }

  @Patch(':id')
  @Roles('admin') // Solo admin modifica proyectos
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
