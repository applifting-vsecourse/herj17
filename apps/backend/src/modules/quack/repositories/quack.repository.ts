import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Prisma,
  Quack as PrismaQuack,
  User as PrismaUser,
} from '@/generated/prisma/client';
import { Poll } from '@/modules/quack/domain/poll';
import { Quack, QuackMood } from '@/modules/quack/domain/quack';
import { Injectable } from '@nestjs/common';

// Loads a poll with per-option vote counts and the viewer's own vote. Counts
// are COUNT(*) over stored votes, so they can't drift from what is in the DB.
const pollOptionsInclude = {
  options: {
    orderBy: { position: 'asc' },
    include: { _count: { select: { votes: true } } },
  },
} satisfies Prisma.PollInclude;

type ViewerVoteInclude = {
  where: { userId: string };
  select: { optionId: true };
};

const pollInclude = (
  viewerId: string,
): typeof pollOptionsInclude & { votes: ViewerVoteInclude } => ({
  ...pollOptionsInclude,
  votes: { where: { userId: viewerId }, select: { optionId: true } },
});

type PrismaPoll = Prisma.PollGetPayload<{
  include: ReturnType<typeof pollInclude>;
}>;

const mapPrismaPollToDomain = (poll: PrismaPoll): Poll => {
  const options = poll.options.map((option) => ({
    id: option.id,
    text: option.text,
    votes: option._count.votes,
  }));
  return {
    id: poll.id,
    options,
    totalVotes: options.reduce((sum, option) => sum + option.votes, 0),
    myVoteOptionId: poll.votes[0]?.optionId,
  };
};

const mapPrismaQuackToDomain = (
  quack: PrismaQuack & { user?: PrismaUser; poll?: PrismaPoll | null },
): Quack => ({
  id: quack.id,
  text: quack.text,
  mood: quack.mood ?? undefined,
  userId: quack.userId,
  createdAt: quack.createdAt,
  updatedAt: quack.updatedAt,
  user: quack.user
    ? {
        id: quack.user.id,
        name: quack.user.name,
        username: quack.user.displayUsername ?? quack.user.username ?? '',
      }
    : undefined,
  poll: quack.poll ? mapPrismaPollToDomain(quack.poll) : undefined,
});

/**
 * If you decide to choose a different ORM or database, you should only need to change the repository files methods implementation.
 * Inject what you need instead of PrismaService and re-implement the methods and model mapping.
 */
@Injectable()
export class QuackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getQuacks(viewerId: string): Promise<Quack[]> {
    const quacks = await this.prisma.quack.findMany({
      include: { user: true, poll: { include: pollInclude(viewerId) } },
      orderBy: { createdAt: 'desc' },
    });
    return quacks.map(mapPrismaQuackToDomain);
  }

  async createQuack(createQuackData: {
    text: string;
    mood?: QuackMood;
    pollOptions?: string[];
    userId: string;
  }): Promise<Quack> {
    const { pollOptions } = createQuackData;
    const quack = await this.prisma.quack.create({
      data: {
        text: createQuackData.text,
        mood: createQuackData.mood,
        user: { connect: { id: createQuackData.userId } },
        poll: pollOptions
          ? {
              create: {
                options: {
                  create: pollOptions.map((text, position) => ({
                    text,
                    position,
                  })),
                },
              },
            }
          : undefined,
      },
      include: {
        user: true,
        poll: { include: pollInclude(createQuackData.userId) },
      },
    });
    return mapPrismaQuackToDomain(quack);
  }

  async getPollOptionIds(
    quackId: string,
  ): Promise<{ pollId: string; optionIds: string[] } | null> {
    const poll = await this.prisma.poll.findUnique({
      where: { quackId },
      select: { id: true, options: { select: { id: true } } },
    });
    return poll
      ? { pollId: poll.id, optionIds: poll.options.map(({ id }) => id) }
      : null;
  }

  async vote(vote: {
    pollId: string;
    optionId: string;
    userId: string;
  }): Promise<Poll> {
    // One row per (poll, user) is the primary key, so changing a vote is an
    // upsert and concurrent clicks can never leave two votes behind.
    await this.prisma.pollVote.upsert({
      where: { pollId_userId: { pollId: vote.pollId, userId: vote.userId } },
      create: vote,
      update: { optionId: vote.optionId },
    });
    const poll = await this.prisma.poll.findUniqueOrThrow({
      where: { id: vote.pollId },
      include: pollInclude(vote.userId),
    });
    return mapPrismaPollToDomain(poll);
  }
}
