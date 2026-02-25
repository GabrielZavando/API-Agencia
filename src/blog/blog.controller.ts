import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  create(@Body() createPostDto: CreatePostDto) {
    return this.blogService.create(createPostDto);
  }

  @Get()
  findAll(@Query('published') published: string) {
    // Público puede ver posts, pero podemos filtrar por publicados
    const isPublished = published === 'true';
    return this.blogService.findAll(isPublished);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // Intentar buscar por ID, si falla, buscar por slug (lógica básica)
    // Para separar mejor, podríamos tener endpoint /slug/:slug
    return this.blogService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.blogService.update(id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
