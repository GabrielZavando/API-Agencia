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
} from '@nestjs/common'
import { ProjectsService } from './projects.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'
import { AuthRequest } from '../common/interfaces/auth.interface'
import { Roles } from '../auth/roles.decorator'
import { ProjectResponseDto } from './dto/project-response.dto'

@Controller('projects')
@UseGuards(FirebaseAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('admin')
  create(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto)
  }

  @Get()
  @Roles('admin')
  findAll(): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAll()
  }

  @Get('my')
  @Roles('client')
  findMyProjects(@Req() req: AuthRequest): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAllByClient(req.user.uid)
  }

  @Get('client/:clientId')
  @Roles('admin')
  findAllByClient(
    @Param('clientId') clientId: string,
  ): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAllByClient(clientId)
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id)
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, updateProjectDto)
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.projectsService.remove(id)
  }
}
