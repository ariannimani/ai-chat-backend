import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/config/guard/jwt-auth.guard';
import { GetChatDto } from 'src/chats/dto/get-chat.dto';
import { ChatsService } from 'src/chats/chats.service';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly chatsService: ChatsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Request() req, @Body() createRoomDto: CreateRoomDto) {
    console.log('req.user:', req.user); // Debug log
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    if (!userId) {
      throw new Error('User ID not found in JWT payload');
    }
    return this.roomsService.create(userId.toString(), createRoomDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getByRequest(@Request() req) {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    if (!userId) {
      throw new Error('User ID not found in JWT payload');
    }
    return this.roomsService.getByRequest(userId.toString());
  }

  @Get(':id/chats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', required: true })
  getChats(@Param('id') id, @Query() dto: GetChatDto) {
    return this.chatsService.findAll(id, new GetChatDto(dto));
  }
}
