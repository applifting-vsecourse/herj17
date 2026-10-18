import { PrismaService } from '@/core/prisma/prisma.service';
import { Quack } from '@/modules/quack/domain/quack';

type CreateQuackParams = {
  text: string;
  userId: string;
  // Optional so the seed can spread posts over time. Without it every seeded
  // quack shares one timestamp and the feed reads like a single burst.
  createdAt?: Date;
  // turns the quack into a poll; the text is the question
  pollOptions?: string[];
};

export async function createQuack(
  prisma: PrismaService,
  params: CreateQuackParams,
): Promise<Quack> {
  const { text, userId, createdAt, pollOptions } = params;

  const quack = await prisma.quack.create({
    data: {
      text,
      createdAt,
      user: {
        connect: {
          id: userId,
        },
      },
      poll: pollOptions
        ? {
            create: {
              options: {
                create: pollOptions.map((option, position) => ({
                  text: option,
                  position,
                })),
              },
            },
          }
        : undefined,
    },
  });
  return { ...quack, mood: quack.mood ?? undefined };
}
