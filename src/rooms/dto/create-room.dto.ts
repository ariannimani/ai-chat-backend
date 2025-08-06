import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { RoomType } from '../enums/room-type.enum';

export class CreateRoomDto {
  @ApiProperty()
  @IsNotEmpty()
  @ValidateIf((o) => o.type != RoomType.PERSONAL)
  name: string;

  @ApiProperty({
    required: false,
    description:
      'Array of user IDs to invite to the room. Leave empty to create a room with just yourself.',
  })
  @IsArray()
  members: string[];

  @ApiProperty({ required: true, default: RoomType.PERSONAL })
  @IsEnum(RoomType)
  @ValidateIf((o) => o.type)
  type: RoomType;

  @ApiProperty({ required: false, description: 'AI instructions for the room' })
  @IsString()
  @IsOptional()
  aiInstructions: string;
}
