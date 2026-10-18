import {
  QUACK_MOODS,
  QuackMoodDto,
} from '@/modules/quack/controllers/dto/create-quack.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

export class UpdateProfileDto {
  @ApiProperty({ example: 'Caffeinated Duck', maxLength: 100 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'caffeinated.duck',
    minLength: 3,
    maxLength: 30,
    pattern: USERNAME_PATTERN.source,
  })
  @Transform(trim)
  @IsString()
  @Length(3, 30)
  @Matches(USERNAME_PATTERN, {
    message: 'username may only contain letters, numbers, dots and underscores',
  })
  username!: string;

  @ApiPropertyOptional({ maxLength: 160, nullable: true })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  bio?: string | null;

  @ApiPropertyOptional({ enum: QUACK_MOODS, nullable: true })
  @IsOptional()
  @IsEnum(QUACK_MOODS)
  defaultMood?: QuackMoodDto | null;
}
