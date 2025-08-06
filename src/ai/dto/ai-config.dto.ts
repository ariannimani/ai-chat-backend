import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { AiProvider } from '../ai-provider.interface';

export class CreateAiConfigDto {
  @ApiProperty({
    enum: AiProvider,
    description: 'AI provider to use',
    default: AiProvider.GROQ,
  })
  @IsEnum(AiProvider)
  provider: AiProvider;

  @ApiProperty({
    description: 'AI model to use',
    example: 'llama3-70b-8192',
  })
  @IsString()
  model: string;

  @ApiProperty({
    description: 'AI instructions',
    required: false,
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({
    description: 'Temperature for AI responses (0.0 to 2.0)',
    required: false,
    minimum: 0,
    maximum: 2,
    default: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({
    description: 'Maximum tokens for AI responses',
    required: false,
    minimum: 1,
    maximum: 4000,
    default: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  max_tokens?: number;

  @ApiProperty({
    description: 'Top P for AI responses (0.0 to 1.0)',
    required: false,
    minimum: 0,
    maximum: 1,
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  top_p?: number;

  @ApiProperty({
    description: 'Frequency penalty for AI responses (-2.0 to 2.0)',
    required: false,
    minimum: -2,
    maximum: 2,
    default: 0.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  frequency_penalty?: number;

  @ApiProperty({
    description: 'Presence penalty for AI responses (-2.0 to 2.0)',
    required: false,
    minimum: -2,
    maximum: 2,
    default: 0.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  presence_penalty?: number;

  @ApiProperty({
    description: 'Room ID this AI config belongs to',
  })
  @IsUUID()
  roomId: string;
}

export class UpdateAiConfigDto {
  @ApiProperty({
    enum: AiProvider,
    description: 'AI provider to use',
    required: false,
  })
  @IsOptional()
  @IsEnum(AiProvider)
  provider?: AiProvider;

  @ApiProperty({
    description: 'AI model to use',
    required: false,
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({
    description: 'AI instructions',
    required: false,
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({
    description: 'Temperature for AI responses (0.0 to 2.0)',
    required: false,
    minimum: 0,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({
    description: 'Maximum tokens for AI responses',
    required: false,
    minimum: 1,
    maximum: 4000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  max_tokens?: number;

  @ApiProperty({
    description: 'Top P for AI responses (0.0 to 1.0)',
    required: false,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  top_p?: number;

  @ApiProperty({
    description: 'Frequency penalty for AI responses (-2.0 to 2.0)',
    required: false,
    minimum: -2,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  frequency_penalty?: number;

  @ApiProperty({
    description: 'Presence penalty for AI responses (-2.0 to 2.0)',
    required: false,
    minimum: -2,
    maximum: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  presence_penalty?: number;
}

export class AiConfigResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AiProvider })
  provider: AiProvider;

  @ApiProperty()
  model: string;

  @ApiProperty({ required: false })
  instructions?: string;

  @ApiProperty()
  temperature: number;

  @ApiProperty()
  max_tokens: number;

  @ApiProperty()
  top_p: number;

  @ApiProperty()
  frequency_penalty: number;

  @ApiProperty()
  presence_penalty: number;

  @ApiProperty()
  roomId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
