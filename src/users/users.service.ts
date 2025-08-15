import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterAuthDto } from '../auth/dto/register-auth.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(dto: RegisterAuthDto) {
    const userData = {
      ...dto,
      username: dto.username || this.generateUniqueUsername(),
    };

    try {
      return await this.userRepository.save(userData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Create user with Supabase ID (for Supabase auth integration)
  async createWithSupabaseId(supabaseUserId: string, dto: RegisterAuthDto) {
    const userData = {
      name: dto.name,
      username: dto.username || this.generateUniqueUsername(),
      email: dto.email,
      id: supabaseUserId,
    };

    try {
      return await this.userRepository.save(userData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Find user by Supabase ID
  async findBySupabaseId(supabaseUserId: string) {
    return await this.userRepository.findOne({
      where: { supabase_user_id: supabaseUserId },
    });
  }

  async validateUser(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'name', 'username', 'email', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('Could not find user.');
    }

    return user;
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Could not find user.');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const result = await this.userRepository.update(id, updateUserDto);

    if (result.affected === 0) {
      throw new NotFoundException('Could not find user.');
    }

    const updatedUser = await this.userRepository.findOne({
      where: { id },
    });

    return {
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  private generateUniqueUsername(): string {
    // Generate a random username using a simple algorithm
    const adjectives = [
      'brave',
      'clever',
      'happy',
      'swift',
      'bright',
      'kind',
      'bold',
    ];
    const nouns = ['tiger', 'eagle', 'wolf', 'fox', 'bear', 'lion', 'hawk'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 9999) + 1;

    return `${adjective}_${noun}_${number}`;
  }
}
