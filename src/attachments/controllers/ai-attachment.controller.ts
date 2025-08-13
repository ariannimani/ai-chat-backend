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
import { AiAttachmentService } from '../services/ai-attachment.service';
import {
  AttachmentResponseDto,
  AttachmentUploadDto,
} from '../services/base-attachment.service';

@Controller('rooms/:roomId/ai-attachments')
@UseGuards(SupabaseAuthGuard)
export class AiAttachmentController {
  constructor(private readonly aiAttachmentService: AiAttachmentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('roomId') roomId: string,
    @Request() req: any,
    @UploadedFile() file: any,
    @Body() uploadDto: AttachmentUploadDto,
  ): Promise<AttachmentResponseDto> {
    return this.aiAttachmentService.uploadAttachment(
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
    return this.aiAttachmentService.getAttachments(roomId, req.authUser.id);
  }

  @Get(':attachmentId/download')
  async downloadAttachment(
    @Param('attachmentId') attachmentId: string,
    @Request() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const fileData = await this.aiAttachmentService.downloadAttachment(
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
    return this.aiAttachmentService.deleteAttachment(
      attachmentId,
      req.authUser.id,
    );
  }
}
