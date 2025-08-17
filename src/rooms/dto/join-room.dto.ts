import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty({
    description: 'Invitation code to join the room',
    example: '266ac7f3f6aa64a1170cc329691bafc3',
  })
  @IsNotEmpty()
  @IsUUID()
  code: string;
}
