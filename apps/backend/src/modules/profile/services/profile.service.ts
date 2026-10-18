import {
  Profile,
  ProfileUpdate,
  UsernameTakenError,
} from '@/modules/profile/domain/profile';
import { ProfileRepository } from '@/modules/profile/repositories/profile.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async getProfile(user: Identity): Promise<Profile> {
    const profile = await this.profileRepository.getProfile(user.id);
    if (!profile) throw new NotFoundException();
    return profile;
  }

  async updateProfile(user: Identity, update: ProfileUpdate): Promise<Profile> {
    if (
      await this.profileRepository.isUsernameTaken(update.username, user.id)
    ) {
      throw new UsernameTakenError(update.username);
    }
    // the profile owner is taken from the session, never from the request body
    return this.profileRepository.updateProfile(user.id, update);
  }
}
