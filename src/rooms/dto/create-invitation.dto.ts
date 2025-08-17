import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    required: false,
    description:
      'Emails of the users to invite (optional if user is already registered)',
  })
  @IsOptional()
  members?: string[];

  @ApiProperty({
    required: false,
    description: 'User ID to invite (optional if inviting by email)',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    required: false,
    description: 'Expiration hours for the invitation (default: 24 hours)',
    default: 24,
  })
  @IsOptional()
  expirationHours?: number;
}
