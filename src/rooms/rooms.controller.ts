import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { GetChatDto } from 'src/chats/dto/get-chat.dto';
import { ChatsService } from 'src/chats/chats.service';

@Controller('rooms')
@ApiBearerAuth()
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly chatsService: ChatsService,
  ) {}

  @Post()
  create(@Request() req, @Body() createRoomDto: CreateRoomDto) {
    const userId = req.authUser.id;
    if (!userId) {
      throw new Error('User ID not found in authentication data');
    }

    return this.roomsService.create(userId.toString(), createRoomDto);
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
