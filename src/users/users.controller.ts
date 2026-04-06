import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  UseGuards,
  Request,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UsersService } from './users.service'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { UserResponseDto } from './dto/user-response.dto'
import { AuthRequest } from '../common/interfaces/auth.interface'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll()
  }

  @Post('register')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto)
  }

  @Get('profile')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@Request() req: AuthRequest): Promise<UserResponseDto> {
    return this.usersService.findOne(req.user.uid)
  }

  @Patch('profile')
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @Request() req: AuthRequest,
    @Body()
    updateData: { displayName?: string; phone?: string; description?: string },
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(req.user.uid, updateData, avatar)
  }

  @Post('set-admin-role')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async setAdminRole(
    @Body() body: { uid: string },
  ): Promise<{ message: string }> {
    return this.usersService.setAdminRole(body.uid)
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id)
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(
      id,
      updateUserDto as Record<string, unknown>,
    )
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.usersService.remove(id)
  }
}
