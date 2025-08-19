import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoomDto {
  @ApiProperty({ required: false, description: 'AI instructions for the room' })
  @IsString()
  @IsOptional()
  aiInstructions: string;

  @ApiProperty({ required: true, description: 'Room name' })
  @IsString()
  name: string;
}
