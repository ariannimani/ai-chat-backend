import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { SupabaseAuthGuard } from '../../config/guard/supabase-auth.guard';
import {
  AttachmentResponseDto,
  AttachmentUploadDto,
} from '../services/base-attachment.service';
import { RoomAttachmentService } from '../services/room-attachment.service';

@Controller('rooms/:roomId/files')
@UseGuards(SupabaseAuthGuard)
export class RoomAttachmentController {
  constructor(private readonly roomAttachmentService: RoomAttachmentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('roomId') roomId: string,
    @Request() req: any,
    @UploadedFile() file: any,
    @Body() uploadDto: AttachmentUploadDto,
  ): Promise<AttachmentResponseDto> {
    return this.roomAttachmentService.uploadAttachment(
      roomId,
      req.authUser.id,
      file,
      uploadDto,
    );
  }

  @Get()
  async getAttachments(
    @Param('roomId') roomId: string,
    @Request() req: any,
  ): Promise<AttachmentResponseDto[]> {
    return this.roomAttachmentService.getAttachments(roomId, req.authUser.id);
  }

  @Get(':attachmentId/download')
  async downloadAttachment(
    @Param('attachmentId') attachmentId: string,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const fileData = await this.roomAttachmentService.downloadAttachment(
      attachmentId,
      req.authUser.id,
    );

    res.set({
      'Content-Type': fileData.mimeType,
      'Content-Disposition': `attachment; filename="${fileData.originalName}"`,
      'Content-Length': fileData.buffer.length.toString(),
    });

    res.send(fileData.buffer);
  }

  @Delete(':attachmentId')
  async deleteAttachment(
    @Param('attachmentId') attachmentId: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    return this.roomAttachmentService.deleteAttachment(
      attachmentId,
      req.authUser.id,
    );
  }
}
