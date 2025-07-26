import { ApiProperty } from '@nestjs/swagger';
import { RoomType } from '../enums/room-type.enum';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';

export class CreateRoomDto {
  @ApiProperty()
  @IsNotEmpty()
  @ValidateIf((o) => o.type != RoomType.PERSONAL)
  name: string;

  @ApiProperty({ required: false, description: 'Array of user IDs to invite to the room. Leave empty to create a room with just yourself.' })
  @IsArray()
  members: string[];

  @ApiProperty({ required: true, default: RoomType.PERSONAL })
  @IsEnum(RoomType)
  @ValidateIf((o) => o.type)
  type: RoomType;
}
