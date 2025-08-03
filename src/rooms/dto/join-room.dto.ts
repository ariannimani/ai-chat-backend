import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty({
    description: 'Invitation code to join the room',
  })
  @IsNotEmpty()
  @IsString()
  invitationCode: string;
}
