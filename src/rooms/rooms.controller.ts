import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
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
import { AiProvider } from 'src/ai/ai-provider.interface';
import { AiService } from 'src/ai/ai.service';
import { GetMessageDto } from 'src/messages/dto/get-message.dto';
import { MessagesService } from 'src/messages/messages.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomAiDto } from './dto/update-room-ai.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@ApiTags('rooms')
@ApiBearerAuth()
export class RoomsController {
  private readonly logger = new Logger(RoomsController.name);

  constructor(
    private readonly roomsService: RoomsService,
    private readonly messagesService: MessagesService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  async create(@Request() req, @Body() createRoomDto: CreateRoomDto) {
    const userId = req.authUser.id;
    const userEmail = req.authUser.email;

    this.logger.log(
      `🏠 Creating room "${createRoomDto.name}" for user ${userEmail}`,
    );

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
  async getByRequest(@Request() req) {
    const userId = req.authUser.id;

    this.logger.log(`📋 Getting rooms for user ${userId}`);

    return this.roomsService.getByRequest(userId);
  }

  @Get('ai/models')
  @ApiOperation({ summary: 'Get all available AI models' })
  async getAvailableModels() {
    const models = this.aiService.getAllAvailableModels();
    return {
      providers: Object.values(AiProvider),
      models: models,
    };
  }

  @Get('ai/models/:provider')
  @ApiOperation({ summary: 'Get available models for a specific provider' })
  @ApiParam({ name: 'provider', enum: AiProvider })
  async getProviderModels(@Param('provider') provider: AiProvider) {
    const models = this.aiService.getAvailableModels(provider);
    return {
      provider,
      models: models,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get room details',
    description:
      'Get room information including members, messages, and AI configuration',
  })
  @ApiParam({ name: 'id', description: 'Room ID' })
  async getById(@Param('id', ParseUUIDPipe) roomId: string, @Request() req) {
    const userId = req.authUser.id;

    this.logger.log(`🔍 Getting room ${roomId} for user ${userId}`);

    return this.roomsService.getById(roomId, userId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update room',
    description:
      'Update the name, instructions, or members of a room. You can only update the room if you are admin.',
  })
  @ApiParam({ name: 'id', description: 'Room ID' })
  async update(
    @Param('id', ParseUUIDPipe) roomId: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @Request() req,
  ) {
    const userId = req.authUser.id;
    const userEmail = req.authUser.email;

    this.logger.log(
      `🔧 User ${userEmail} updating room ${roomId} to ${updateRoomDto.name}`,
    );

    return this.roomsService.update(roomId, userId, updateRoomDto);
  }

  @Put(':id/ai')
  @ApiOperation({
    summary: 'Update room AI configuration',
    description:
      'Update the AI provider, model, and other settings for a room. Conversation history is preserved across model changes.',
  })
  @ApiParam({ name: 'id', description: 'Room ID' })
  async updateRoomAiConfig(
    @Param('id', ParseUUIDPipe) roomId: string,
    @Body() updateRoomAiDto: UpdateRoomAiDto,
    @Request() req,
  ) {
    const userId = req.authUser.id;
    const userEmail = req.authUser.email;

    this.logger.log(
      `🔧 User ${userEmail} updating AI config for room ${roomId} to ${updateRoomAiDto.ai_provider}/${updateRoomAiDto.ai_model}`,
    );

    try {
      const result = await this.roomsService.updateAiConfig(
        roomId,
        userId,
        updateRoomAiDto,
      );
      this.logger.log(
        `✅ AI configuration updated successfully for room ${roomId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`❌ AI configuration update failed:`, error.message);
      throw error;
    }
  }

  @Get(':id/messages')
  @ApiParam({ name: 'id', description: 'Room ID' })
  async getMessages(
    @Param('id', ParseUUIDPipe) roomId: string,
    @Query() getMessageDto: GetMessageDto,
    @Request() req,
  ) {
    const userId = req.authUser.id;

    this.logger.log(`💬 Getting messages for room ${roomId} by user ${userId}`);

    return this.messagesService.getByRoomId(roomId, userId, getMessageDto);
  }

  @Post(':id/leave')
  @ApiOperation({
    summary: 'Leave a room',
    description: 'Remove yourself from a room you are a member of',
  })
  @ApiParam({ name: 'id', description: 'Room ID' })
  async leave(@Param('id', ParseUUIDPipe) roomId: string, @Request() req) {
    const userId = req.authUser.id;
    const userEmail = req.authUser.email;

    this.logger.log(`👋 User ${userEmail} leaving room ${roomId}`);

    try {
      const result = await this.roomsService.leave(userId.toString(), roomId);
      this.logger.log(`✅ User successfully left room: ${result.room.name}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Leave room failed:`, error.message);
      throw error;
    }
  }
}
