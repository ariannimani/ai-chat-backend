import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { SupabaseService } from '../config/supabase/supabase.service';
import { GetMessageDto } from './dto/get-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
@ApiBearerAuth()
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get(':roomId')
  async findAll(
    @Param('roomId') roomId: string,
    @Query() getMessageDto: GetMessageDto,
  ) {
    return this.messagesService.findAll(roomId, getMessageDto);
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
      const filePath = `message-files/${roomId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('message-uploads')
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
      } = supabase.storage.from('message-uploads').getPublicUrl(filePath);

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
      console.error('❌ File upload failed:', error.message);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  @Get(':roomId/files')
  async listFiles(@Param('roomId') roomId: string) {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase.storage
        .from('message-uploads')
        .list(`message-files/${roomId}`);

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }

      return {
        message: 'Files retrieved successfully',
        data: data || [],
      };
    } catch (error) {
      console.error('❌ Failed to list files:', error.message);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
}
