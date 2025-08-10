import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import '../types/express';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: ExpressRequest) {
    const user = await this.usersService.findOne(req.user!.id);
    const stats = await this.usersService.getStats(req.user!.id);
    return {
      ...user,
      stats,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('profile')
  async updateProfile(
    @Request() req: ExpressRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user!.id, updateUserDto);
  }

  @Post('profile/image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadProfileImage(
    @Request() req: ExpressRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const imagePath = `/uploads/profiles/${file.filename}`;
    return this.usersService.updateProfileImage(req.user!.id, imagePath);
  }

  @Delete('profile/image')
  async deleteProfileImage(@Request() req: ExpressRequest) {
    return this.usersService.deleteProfileImage(req.user!.id);
  }

  @Get('profile/stats')
  async getStats(@Request() req: ExpressRequest) {
    return this.usersService.getStats(req.user!.id);
  }
}
