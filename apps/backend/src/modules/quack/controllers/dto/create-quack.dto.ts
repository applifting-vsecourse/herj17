import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreatePollDto } from './create-poll.dto';

export const QUACK_MOODS = ['happy', 'sad', 'angry', 'silly'] as const;
export type QuackMoodDto = (typeof QUACK_MOODS)[number];

export class CreateQuackDto {
  @ApiProperty({
    description: 'Body of the quack',
    example: 'Hello, world!',
    maxLength: 280,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  text!: string;

  @ApiPropertyOptional({ enum: QUACK_MOODS })
  @IsOptional()
  @IsEnum(QUACK_MOODS)
  mood?: QuackMoodDto;

  @ApiPropertyOptional({
    type: CreatePollDto,
    description: 'Turns the quack into a poll; the text is the question',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll?: CreatePollDto;
}
