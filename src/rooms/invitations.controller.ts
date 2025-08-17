import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { RoomsService } from './rooms.service';

@Controller('invitations')
@ApiTags('invitations')
@ApiBearerAuth()
export class InvitationsController {
  private readonly logger = new Logger(InvitationsController.name);

  constructor(private readonly roomsService: RoomsService) {}

  @Post('room/:roomId')
  @ApiOperation({
    summary: 'Create an invitation for a room',
    description:
      'Create an invitation code that allows other users to join the specified room',
  })
  @ApiParam({ name: 'roomId', description: 'Room ID to create invitation for' })
  async createInvitation(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() createInvitationDto: CreateInvitationDto,
    @Request() req,
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
      this.logger.log(`✅ Invitations created successfully: ${result.code}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Invitations creation failed:`, error.message);
      throw error;
    }
  }

  @Get('room/:roomId')
  @ApiOperation({
    summary: 'Get invitations for a room',
    description: 'Get all invitations created for a specific room',
  })
  @ApiParam({ name: 'roomId', description: 'Room ID to get invitations for' })
  async getRoomInvitations(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Request() req,
  ) {
    const userId = req.authUser.id;

    if (!userId) {
      throw new Error('User ID not found in authentication data');
    }

    this.logger.log(
      `📧 Getting invitations for room ${roomId} by user ${userId}`,
    );

    // Note: This method might not exist in RoomsService yet
    // You may need to implement it or use getUserInvitations instead
    return this.roomsService.getUserInvitations(userId.toString());
  }

  @Get('user')
  @ApiOperation({
    summary: 'Get pending invitations for current user',
    description: 'Get all pending invitations for the authenticated user',
  })
  async getUserInvitations(@Request() req) {
    const userId = req.authUser.id;

    if (!userId) {
      throw new Error('User ID not found in authentication data');
    }

    this.logger.log(
      `📨 Getting pending invitations for user ${req.authUser.email}`,
    );

    return this.roomsService.getUserInvitations(userId.toString());
  }

  @Put(':invitationId')
  @ApiOperation({
    summary: 'Accept or decline an invitation',
    description: 'Update the status of an invitation (accept/decline)',
  })
  @ApiParam({ name: 'invitationId', description: 'Invitation ID to update' })
  async updateInvitation(
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @Body() updateInvitationDto: UpdateInvitationDto,
    @Request() req,
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

  @Post('join')
  @ApiOperation({
    summary: 'Join a room using invitation code',
    description: 'Join a room by providing a valid invitation code',
  })
  async joinRoom(@Body() joinRoomDto: JoinRoomDto, @Request() req) {
    const userId = req.authUser.id;
    const userEmail = req.authUser.email;

    if (!userId) {
      throw new Error('User ID not found in authentication data');
    }

    this.logger.log(
      `🚪 User ${userEmail} attempting to join room with invitation code ${joinRoomDto.code}`,
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
}
