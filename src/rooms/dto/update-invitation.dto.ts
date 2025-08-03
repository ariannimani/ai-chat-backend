import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { InvitationStatus } from '../entities/invitation.entity';

export class UpdateInvitationDto {
  @ApiProperty({
    description: 'Action to take on the invitation',
    enum: [InvitationStatus.ACCEPTED, InvitationStatus.DECLINED],
  })
  @IsNotEmpty()
  @IsEnum([InvitationStatus.ACCEPTED, InvitationStatus.DECLINED])
  status: InvitationStatus.ACCEPTED | InvitationStatus.DECLINED;
}
