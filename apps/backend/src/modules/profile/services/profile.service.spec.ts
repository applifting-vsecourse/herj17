import { Profile, UsernameTakenError } from '@/modules/profile/domain/profile';
import { ProfileRepository } from '@/modules/profile/repositories/profile.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { ProfileService } from './profile.service';

const aProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'u1',
  name: 'Caffeinated Duck',
  username: 'CaffeinatedDuck',
  ...overrides,
});

const user = { id: 'u1' } as Identity;

describe('ProfileService', () => {
  it("returns the signed-in user's profile", async () => {
    const repository = mock<ProfileRepository>();
    repository.getProfile.mockResolvedValue(aProfile());

    const service = new ProfileService(repository);

    await expect(service.getProfile(user)).resolves.toEqual(aProfile());
    expect(repository.getProfile).toHaveBeenCalledWith('u1');
  });

  it('throws when the profile does not exist', async () => {
    const repository = mock<ProfileRepository>();
    repository.getProfile.mockResolvedValue(null);

    const service = new ProfileService(repository);

    await expect(service.getProfile(user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates the profile of the signed-in user', async () => {
    const updated = aProfile({ username: 'new.duck', bio: 'hi' });
    const repository = mock<ProfileRepository>();
    repository.isUsernameTaken.mockResolvedValue(false);
    repository.updateProfile.mockResolvedValue(updated);

    const service = new ProfileService(repository);
    const update = {
      name: 'Caffeinated Duck',
      username: 'new.duck',
      bio: 'hi',
    };

    await expect(service.updateProfile(user, update)).resolves.toEqual(updated);
    expect(repository.isUsernameTaken).toHaveBeenCalledWith('new.duck', 'u1');
    expect(repository.updateProfile).toHaveBeenCalledWith('u1', update);
  });

  it('refuses a username someone else already has', async () => {
    const repository = mock<ProfileRepository>();
    repository.isUsernameTaken.mockResolvedValue(true);

    const service = new ProfileService(repository);

    await expect(
      service.updateProfile(user, { name: 'Duck', username: 'BreadCritic' }),
    ).rejects.toBeInstanceOf(UsernameTakenError);
    expect(repository.updateProfile).not.toHaveBeenCalled();
  });
});
