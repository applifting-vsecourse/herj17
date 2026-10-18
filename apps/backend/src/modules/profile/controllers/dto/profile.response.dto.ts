import { Profile } from '@/modules/profile/domain/profile';
import { QuackMood } from '@/modules/quack/domain/quack';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  username!: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional({ enum: ['happy', 'sad', 'angry', 'silly'] })
  defaultMood?: QuackMood;

  static fromDomain(profile: Profile): ProfileResponseDto {
    return {
      id: profile.id,
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
      defaultMood: profile.defaultMood,
    };
  }
}
