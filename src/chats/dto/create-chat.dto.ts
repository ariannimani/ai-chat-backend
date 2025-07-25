import { IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateChatDto {
  @IsNotEmpty()
  readonly room_id: string;

  @IsNotEmpty()
  readonly content: string;

  @IsOptional()
  @IsIn(['chat', 'ai'])
  readonly messageType?: 'chat' | 'ai' = 'chat'; // Default to regular chat
}
