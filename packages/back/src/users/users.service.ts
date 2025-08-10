import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'username',
        'firstName',
        'lastName',
        'profileImage',
        'bio',
        'phoneNumber',
        'location',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Check if username is being changed and if it's already taken
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.usersRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUser) {
        throw new BadRequestException('Username already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async updateProfileImage(id: string, imagePath: string): Promise<User> {
    const user = await this.findOne(id);

    // Delete old profile image if exists
    if (user.profileImage) {
      const oldImagePath = path.join(process.cwd(), user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    user.profileImage = imagePath;
    return this.usersRepository.save(user);
  }

  async deleteProfileImage(id: string): Promise<User> {
    const user = await this.findOne(id);

    if (user.profileImage) {
      const imagePath = path.join(process.cwd(), user.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      user.profileImage = '';
      return this.usersRepository.save(user);
    }

    return user;
  }

  async getStats(id: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['quizzes', 'quizAttempts'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalQuizzesCreated = user.quizzes?.length || 0;
    const totalQuizzesTaken = user.quizAttempts?.length || 0;

    // Calculate average score
    let averageScore = 0;
    if (user.quizAttempts?.length > 0) {
      const totalScore = user.quizAttempts.reduce((sum, attempt) => {
        return sum + (attempt.score || 0);
      }, 0);
      averageScore = Math.round(totalScore / user.quizAttempts.length);
    }

    // Calculate pass rate
    let passRate = 0;
    if (user.quizAttempts?.length > 0) {
      const passedAttempts = user.quizAttempts.filter(
        (attempt) => attempt.passed,
      ).length;
      passRate = Math.round((passedAttempts / user.quizAttempts.length) * 100);
    }

    return {
      totalQuizzesCreated,
      totalQuizzesTaken,
      averageScore,
      passRate,
    };
  }
}
