import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, MinLength } from 'class-validator';
import { LoginAuthDto } from './login-auth.dto';

export class RegisterAuthDto extends PartialType(LoginAuthDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({
    required: false,
    description: 'If not provided, a random username will be generated',
  })
  @IsOptional()
  @MinLength(3)
  username?: string;
}
