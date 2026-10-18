import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma, User as PrismaUser } from '@/generated/prisma/client';
import {
  Profile,
  ProfileUpdate,
  UsernameTakenError,
} from '@/modules/profile/domain/profile';
import { Injectable } from '@nestjs/common';

const mapPrismaUserToProfile = (user: PrismaUser): Profile => ({
  id: user.id,
  name: user.name,
  // displayUsername keeps the casing the user typed; username is BetterAuth's
  // lowercased lookup key
  username: user.displayUsername ?? user.username ?? '',
  bio: user.bio ?? undefined,
  defaultMood: user.defaultMood ?? undefined,
});

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<Profile | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? mapPrismaUserToProfile(user) : null;
  }

  async isUsernameTaken(
    username: string,
    exceptUserId: string,
  ): Promise<boolean> {
    const owner = await this.prisma.user.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
        id: { not: exceptUserId },
      },
      select: { id: true },
    });
    return owner !== null;
  }

  async updateProfile(userId: string, update: ProfileUpdate): Promise<Profile> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: update.name,
          // stored the way BetterAuth's username plugin stores it, so signing
          // in by username keeps working
          username: update.username.toLowerCase(),
          displayUsername: update.username,
          bio: update.bio ?? null,
          defaultMood: update.defaultMood ?? null,
        },
      });
      return mapPrismaUserToProfile(user);
    } catch (error) {
      // the pre-check in the service can lose a race; the unique index can't
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new UsernameTakenError(update.username);
      }
      throw error;
    }
  }
}
