import { IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  readonly room_id: string;

  @IsNotEmpty()
  readonly content: string;

  @IsOptional()
  @IsIn(['message', 'ai'])
  readonly messageType?: 'message' | 'ai' = 'message'; // Default to regular chat
}
