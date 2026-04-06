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
} from '@nestjs/common'
import { BlogService } from './blog.service'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { PostResponseDto } from './dto/post-response.dto'
import { PostListItemDto } from './dto/post-list-item.dto'

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async create(@Body() createPostDto: CreatePostDto): Promise<PostResponseDto> {
    return this.blogService.create(createPostDto)
  }

  @Get()
  async findAll(
    @Query('published') published: string,
  ): Promise<PostListItemDto[]> {
    const isPublished = published === 'true'
    return this.blogService.findAll(isPublished)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PostResponseDto> {
    return this.blogService.findOne(id)
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<PostResponseDto> {
    return this.blogService.findBySlug(slug)
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    return this.blogService.update(id, updatePostDto)
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async remove(
    @Param('id') id: string,
  ): Promise<{ id: string; deleted: boolean }> {
    return this.blogService.remove(id)
  }
}
