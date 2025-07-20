import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatsService } from './chats.service';
import { GetChatDto } from './dto/get-chat.dto';
import { JwtAuthGuard } from '../config/guard/jwt-auth.guard';
import { ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase/supabase.service';

@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get(':roomId')
  async findAll(
    @Param('roomId') roomId: string,
    @Query() getChatDto: GetChatDto,
  ) {
    return this.chatsService.findAll(roomId, getChatDto);
  }

  @Post(':roomId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(@Param('roomId') roomId: string, @UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file provided');
    }

    try {
      const supabase = this.supabaseService.getClient();
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = `chat-files/${roomId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('chat-uploads')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('chat-uploads').getPublicUrl(filePath);

      return {
        message: 'File uploaded successfully',
        data: {
          path: data.path,
          publicUrl,
          fileName: file.originalname,
          size: file.size,
          type: file.mimetype,
        },
      };
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  @Get(':roomId/files')
  async listFiles(@Param('roomId') roomId: string) {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase.storage
        .from('chat-uploads')
        .list(`chat-files/${roomId}`);

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }

      return {
        message: 'Files retrieved successfully',
        data: data || [],
      };
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
}
