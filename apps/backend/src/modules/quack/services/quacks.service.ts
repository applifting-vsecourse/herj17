import {
  Poll,
  PollNotFoundError,
  PollOptionNotFoundError,
} from '@/modules/quack/domain/poll';
import {
  Quack,
  QuackMood,
  QuackNotFoundError,
  QuackNotOwnedError,
} from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity, isAdmin } from '@/shared/auth/domain/identity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QuacksService {
  constructor(private readonly quackRepository: QuackRepository) {}

  // the viewer decides which poll option shows as "my vote"
  async getQuacks(viewer: Identity): Promise<Quack[]> {
    return this.quackRepository.getQuacks(viewer.id);
  }

  async createQuack(
    user: Identity,
    quackData: { text: string; mood?: QuackMood; pollOptions?: string[] },
  ): Promise<Quack> {
    return this.quackRepository.createQuack({
      text: quackData.text,
      mood: quackData.mood,
      pollOptions: quackData.pollOptions,
      // the author is taken from the session, never from the request body
      userId: user.id,
    });
  }

  async deleteQuack(user: Identity, quackId: string): Promise<void> {
    const authorId = await this.quackRepository.getQuackAuthorId(quackId);
    if (!authorId) throw new QuackNotFoundError(quackId);
    // the author may delete their own quack; an admin (moderator) may delete any
    if (authorId !== user.id && !isAdmin(user)) {
      throw new QuackNotOwnedError(quackId);
    }
    const deleted = await this.quackRepository.deleteQuack({
      id: quackId,
      userId: authorId,
    });
    // deleted by a concurrent request in the meantime
    if (!deleted) throw new QuackNotFoundError(quackId);
  }

  async vote(user: Identity, quackId: string, optionId: string): Promise<Poll> {
    const poll = await this.quackRepository.getPollOptionIds(quackId);
    if (!poll) throw new PollNotFoundError(quackId);
    // the composite foreign key would reject it too; this gives a clear 400
    if (!poll.optionIds.includes(optionId)) {
      throw new PollOptionNotFoundError(optionId);
    }
    return this.quackRepository.vote({
      pollId: poll.pollId,
      optionId,
      // the voter is taken from the session, never from the request body
      userId: user.id,
    });
  }
}
