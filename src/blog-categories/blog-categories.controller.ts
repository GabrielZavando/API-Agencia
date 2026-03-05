import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BlogCategoriesService } from './blog-categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('blog-categories')
export class BlogCategoriesController {
  constructor(private readonly blogCategoriesService: BlogCategoriesService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    try {
      return await this.blogCategoriesService.create(createCategoryDto);
    } catch (err) {
      const error = err as Error;
      throw new HttpException(
        error.message || 'Error creatomg category',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.blogCategoriesService.findAll();
    } catch (err) {
      const error = err as Error;
      throw new HttpException(
        error.message || 'Error fetching categories',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.blogCategoriesService.findOne(id);
    } catch (err) {
      const error = err as Error;
      throw new HttpException(
        error.message || 'Category not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    try {
      return await this.blogCategoriesService.update(id, updateCategoryDto);
    } catch (err) {
      const error = err as Error;
      throw new HttpException(
        error.message || 'Error updating category',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async remove(@Param('id') id: string) {
    try {
      return await this.blogCategoriesService.remove(id);
    } catch (err) {
      const error = err as Error;
      throw new HttpException(
        error.message || 'Error deleting category',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
