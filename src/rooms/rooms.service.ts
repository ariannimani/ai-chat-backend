import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    @InjectRepository(Room) private roomRepository: Repository<Room>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(userId: string, createRoomDto: CreateRoomDto, userInfo?: { email: string; name: string }) {
    let user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user && userInfo) {
      this.logger.log(`🆕 Auto-creating user: ${userInfo.email}`);
      
      // Auto-create user in local database
      user = this.userRepository.create({
        id: userId,
        email: userInfo.email,
        name: userInfo.name,
        username: userInfo.email, // Use email as username for auto-created users
        password: 'supabase-auth', // Placeholder since we use Supabase for auth
        password_key: 'supabase-auth', // Placeholder since we use Supabase for auth
      });
      
      user = await this.userRepository.save(user);
    } else if (!user) {
      this.logger.error(`❌ User not found with ID: ${userId}`);
      throw new Error(`User not found with ID: ${userId}. Please ensure user is properly registered in the system.`);
    }

    // Combine provided member IDs with current user ID
    const memberIds = [...(createRoomDto.members || []), user.id].filter(Boolean);
    const members = await this.userRepository.findByIds(memberIds);

    // Check if any members were not found
    const foundMemberIds = members.map(m => m.id);
    const missingMemberIds = memberIds.filter(id => !foundMemberIds.includes(id));
    if (missingMemberIds.length > 0) {
      this.logger.warn(`⚠️ Some members not found:`, missingMemberIds);
    }

    const room = this.roomRepository.create({
      ...createRoomDto,
      members: [...members, user], // Ensure current user is included
    });

    const savedRoom = await this.roomRepository.save(room);
    this.logger.log(`✅ Room "${savedRoom.name}" created with ${savedRoom.members.length} members`);

    return savedRoom;
  }

  async getByRequest(userId: string) {
    const rooms = await this.roomRepository.find({
      where: {
        members: {
          id: userId,
        },
      },
      relations: ['members'],
    });

    this.logger.log(`📋 Found ${rooms.length} rooms for user`);
    return rooms;
  }
}
