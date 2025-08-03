import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GetMessageDto } from 'src/messages/dto/get-message.dto';
import { MessagesService } from 'src/messages/messages.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@ApiBearerAuth()
@ApiTags('rooms')
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

  // Invitation endpoints

  @Post(':id/invite')
  @ApiOperation({ summary: 'Create an invitation for a room' })
  @ApiParam({ name: 'id', required: true, description: 'Room ID' })
  async createInvitation(
    @Param('id') roomId: string,
    @Request() req,
    @Body() createInvitationDto: CreateInvitationDto,
  ) {
    const userId = req.authUser.id;

    if (!userId) {
      throw new Error('User ID not found in authentication data');
    }

    this.logger.log(
      `💌 Creating invitation for room ${roomId} by user ${req.authUser.email}`,
    );

    try {
      const result = await this.roomsService.createInvitation(
        roomId,
        userId.toString(),
        createInvitationDto,
      );
      this.logger.log(`✅ Invitation created successfully: ${result.code}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Invitation creation failed:`, error.message);
      throw error;
    }
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a room using an invitation code' })
  async joinRoom(@Request() req, @Body() joinRoomDto: JoinRoomDto) {
    const userId = req.authUser.id;

    if (!userId) {
      throw new Error('User ID not found in authentication data');
    }

    this.logger.log(
      `🚪 User ${req.authUser.email} attempting to join room with invitation code`,
    );

    try {
      const result = await this.roomsService.joinRoom(
        userId.toString(),
        joinRoomDto,
      );
      this.logger.log(`✅ User successfully joined room: ${result.room.name}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Room join failed:`, error.message);
      throw error;
    }
  }

  @Get('invitations')
  @ApiOperation({ summary: 'Get pending invitations for the current user' })
  async getInvitations(@Request() req) {
    const userId = req.authUser.id;

    if (!userId) {
      throw new Error('User ID not found in authentication data');
    }

    return this.roomsService.getUserInvitations(userId.toString());
  }

  @Put('invitations/:id')
  @ApiOperation({ summary: 'Accept or decline an invitation' })
  @ApiParam({ name: 'id', required: true, description: 'Invitation ID' })
  async updateInvitation(
    @Param('id') invitationId: string,
    @Request() req,
    @Body() updateInvitationDto: UpdateInvitationDto,
  ) {
    const userId = req.authUser.id;

    if (!userId) {
      throw new Error('User ID not found in authentication data');
    }

    this.logger.log(
      `📝 User ${req.authUser.email} updating invitation ${invitationId} to ${updateInvitationDto.status}`,
    );

    try {
      const result = await this.roomsService.updateInvitation(
        invitationId,
        userId.toString(),
        updateInvitationDto,
      );
      this.logger.log(`✅ Invitation updated successfully`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Invitation update failed:`, error.message);
      throw error;
    }
  }
}
