import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AiProvider } from '../../ai/ai-provider.interface';

export class UpdateRoomAiDto {
  @ApiProperty({
    enum: AiProvider,
    description: 'AI provider to use for this room',
    required: false,
  })
  @IsOptional()
  @IsEnum(AiProvider)
  ai_provider?: AiProvider;

  @ApiProperty({
    description: 'AI model to use for this room',
    required: false,
    example: 'gpt-4o-mini',
  })
  @IsOptional()
  @IsString()
  ai_model?: string;

  @ApiProperty({
    description: 'AI instructions for the room',
    required: false,
  })
  @IsOptional()
  @IsString()
  ai_instructions?: string;

  @ApiProperty({
    description: 'Temperature for AI responses (0.0 to 2.0)',
    required: false,
    minimum: 0,
    maximum: 2,
    example: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  ai_temperature?: number;

  @ApiProperty({
    description: 'Maximum tokens for AI responses',
    required: false,
    minimum: 1,
    maximum: 4000,
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  ai_max_tokens?: number;

  @ApiProperty({
    description: 'Top P for AI responses (0.0 to 1.0)',
    required: false,
    minimum: 0,
    maximum: 1,
    example: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  ai_top_p?: number;

  @ApiProperty({
    description: 'Frequency penalty for AI responses (-2.0 to 2.0)',
    required: false,
    minimum: -2,
    maximum: 2,
    example: 0.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  ai_frequency_penalty?: number;

  @ApiProperty({
    description: 'Presence penalty for AI responses (-2.0 to 2.0)',
    required: false,
    minimum: -2,
    maximum: 2,
    example: 0.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  ai_presence_penalty?: number;
}
