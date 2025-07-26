import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Logger,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { GetChatDto } from 'src/chats/dto/get-chat.dto';
import { ChatsService } from 'src/chats/chats.service';

@Controller('rooms')
@ApiBearerAuth()
export class RoomsController {
  private readonly logger = new Logger(RoomsController.name);

  constructor(
    private readonly roomsService: RoomsService,
    private readonly chatsService: ChatsService,
  ) {}

  @Post()
  async create(@Request() req, @Body() createRoomDto: CreateRoomDto) {
    const userId = req.authUser.id;
    const userEmail = req.authUser.email;
    
         this.logger.log(`🏠 Creating room "${createRoomDto.name}" for ${userEmail} with ${createRoomDto.members?.length || 0} members`);

    if (!userId) {
      this.logger.error('❌ User ID not found in authentication data');
      throw new Error('User ID not found in authentication data');
    }

         try {
       const result = await this.roomsService.create(userId.toString(), createRoomDto, {
         email: userEmail,
         name: req.authUser.name || req.authUser.user_metadata?.name || userEmail
       });
       this.logger.log(`✅ Room created successfully: ${result.id}`);
       return result;
     } catch (error) {
       this.logger.error(`❌ Room creation failed:`, error.message);
       throw error;
     }
  }

  @Get()
  getByRequest(@Request() req) {
    const userId = req.authUser.id;

    if (!userId) {
      throw new Error('User ID not found in authentication data');
    }

    return this.roomsService.getByRequest(userId.toString());
  }

  @Get(':id/chats')
  @ApiParam({ name: 'id', required: true })
  getChats(@Param('id') id, @Query() dto: GetChatDto) {
    return this.chatsService.findAll(id, new GetChatDto(dto));
  }
}
