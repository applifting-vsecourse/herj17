import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
