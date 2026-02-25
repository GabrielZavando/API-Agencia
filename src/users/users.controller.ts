import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async findAll() {
    return this.usersService.findAll();
  }

  @Post('register')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('profile')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.uid);
  }

  @Patch('profile')
  @UseGuards(FirebaseAuthGuard)
  async updateProfile(@Request() req, @Body() updateData: { displayName?: string; phone?: string }) {
    return this.usersService.updateProfile(req.user.uid, updateData);
  }

  @Post('set-admin-role')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async setAdminRole(@Body() body: { uid: string }) {
    return this.usersService.setAdminRole(body.uid);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }
}

