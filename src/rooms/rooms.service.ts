import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private roomRepository: Repository<Room>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(userId: string, createRoomDto: CreateRoomDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    const memberIds = [...(createRoomDto.members || [])].filter(Boolean);
    const members = await this.userRepository.findByIds(memberIds);

    const room = this.roomRepository.create({
      ...createRoomDto,
      members: [...members, user],
    });

    return await this.roomRepository.save(room);
  }

  async getByRequest(userId: string) {
    return await this.roomRepository.find({
      where: {
        members: {
          id: userId,
        },
      },
      relations: ['members'],
    });
  }
}
