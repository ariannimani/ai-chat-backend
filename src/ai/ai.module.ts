import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AttachmentsModule } from '../attachments/attachments.module';
import { AiService } from './ai.service';

@Module({
  imports: [ConfigModule, AttachmentsModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
