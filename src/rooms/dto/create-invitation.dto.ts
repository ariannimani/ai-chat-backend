import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Validate } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    required: false,
    description:
      'Email of the user to invite (optional if user is already registered)',
  })
  @IsOptional()
  @Validate((value) => value === '' || IsEmail(value))
  email?: string;

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
