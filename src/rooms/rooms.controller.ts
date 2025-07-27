import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { GetMessageDto } from 'src/messages/dto/get-message.dto';
import { MessagesService } from 'src/messages/messages.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@ApiBearerAuth()
export class RoomsController {
  private readonly logger = new Logger(RoomsController.name);

  constructor(
    private readonly roomsService: RoomsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Post()
  async create(@Request() req, @Body() createRoomDto: CreateRoomDto) {
    const userId = req.authUser.id;
    const userEmail = req.authUser.email;

    this.logger.log(
      `🏠 Creating room "${createRoomDto.name}" for ${userEmail} with ${createRoomDto.members?.length || 0} members`,
    );

    if (!userId) {
      this.logger.error('❌ User ID not found in authentication data');
      throw new Error('User ID not found in authentication data');
    }

    try {
      const result = await this.roomsService.create(
        userId.toString(),
        createRoomDto,
        {
          email: userEmail,
          name:
            req.authUser.name || req.authUser.user_metadata?.name || userEmail,
        },
      );
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

  @Get(':id/messages')
  @ApiParam({ name: 'id', required: true })
  getMessages(@Param('id') id, @Query() dto: GetMessageDto) {
    return this.messagesService.findAll(id, new GetMessageDto(dto));
  }
}
