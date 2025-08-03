import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterAuthDto } from '../auth/dto/register-auth.dto';
import { PasswordHashHelper } from '../helper/hash/password-hash.helper';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(dto: RegisterAuthDto) {
    const passwordGenerator = await PasswordHashHelper.hash(dto.password);

    const userData = {
      ...dto,
      password: passwordGenerator.hash,
      password_key: passwordGenerator.passKey,
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
      username: dto.username,
      email: dto.email,
      supabase_user_id: supabaseUserId, // Store Supabase user ID separately
      password: 'supabase-auth', // Placeholder since Supabase handles auth
      password_key: 'supabase-auth', // Placeholder since Supabase handles auth
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

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'name',
        'username',
        'email',
        'password',
        'password_key',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('Could not find user.');
    }

    const isPasswordCorrect = await PasswordHashHelper.comparePassword(
      password,
      user.password_key,
      user.password,
    );

    if (!isPasswordCorrect) {
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
}
