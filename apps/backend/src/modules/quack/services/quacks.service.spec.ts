// Example unit test — the pattern to copy for your own services.
// The repository is mocked, so the test exercises the service in isolation.
import {
  Poll,
  PollNotFoundError,
  PollOptionNotFoundError,
} from '@/modules/quack/domain/poll';
import { Quack } from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { mock } from 'jest-mock-extended';
import { QuacksService } from './quacks.service';

const aQuack = (overrides: Partial<Quack> = {}): Quack => ({
  id: 'q1',
  text: 'quack quack',
  userId: 'u1',
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  user: { id: 'u1', name: 'Caffeinated Duck', username: 'CaffeinatedDuck' },
  ...overrides,
});

const aPoll = (overrides: Partial<Poll> = {}): Poll => ({
  id: 'p1',
  options: [
    { id: 'o1', text: 'Pizza', votes: 1 },
    { id: 'o2', text: 'Sushi', votes: 0 },
  ],
  totalVotes: 1,
  myVoteOptionId: 'o1',
  ...overrides,
});

const user = { id: 'u1' } as Identity;

describe('QuacksService', () => {
  it('returns quacks from the repository as seen by the viewer', async () => {
    const quacks = [aQuack()];
    const repository = mock<QuackRepository>();
    repository.getQuacks.mockResolvedValue(quacks);

    const service = new QuacksService(repository);

    await expect(service.getQuacks(user)).resolves.toEqual(quacks);
    expect(repository.getQuacks).toHaveBeenCalledWith('u1');
  });

  it('creates a quack owned by the signed-in user', async () => {
    const created = aQuack({ id: 'q2', text: 'hello' });
    const repository = mock<QuackRepository>();
    repository.createQuack.mockResolvedValue(created);

    const service = new QuacksService(repository);

    await expect(service.createQuack(user, { text: 'hello' })).resolves.toEqual(
      created,
    );
    // the author comes from the session, not from the caller's payload
    expect(repository.createQuack).toHaveBeenCalledWith({
      text: 'hello',
      userId: 'u1',
    });
  });

  it('creates a quack with a poll', async () => {
    const repository = mock<QuackRepository>();
    repository.createQuack.mockResolvedValue(aQuack({ poll: aPoll() }));

    const service = new QuacksService(repository);

    await service.createQuack(user, {
      text: 'Lunch?',
      pollOptions: ['Pizza', 'Sushi'],
    });
    expect(repository.createQuack).toHaveBeenCalledWith({
      text: 'Lunch?',
      pollOptions: ['Pizza', 'Sushi'],
      userId: 'u1',
    });
  });

  describe('vote', () => {
    it('records the vote of the signed-in user', async () => {
      const repository = mock<QuackRepository>();
      repository.getPollOptionIds.mockResolvedValue({
        pollId: 'p1',
        optionIds: ['o1', 'o2'],
      });
      repository.vote.mockResolvedValue(aPoll({ myVoteOptionId: 'o2' }));

      const service = new QuacksService(repository);

      await expect(service.vote(user, 'q1', 'o2')).resolves.toEqual(
        aPoll({ myVoteOptionId: 'o2' }),
      );
      expect(repository.getPollOptionIds).toHaveBeenCalledWith('q1');
      expect(repository.vote).toHaveBeenCalledWith({
        pollId: 'p1',
        optionId: 'o2',
        userId: 'u1',
      });
    });

    it('refuses to vote on a quack without a poll', async () => {
      const repository = mock<QuackRepository>();
      repository.getPollOptionIds.mockResolvedValue(null);

      const service = new QuacksService(repository);

      await expect(service.vote(user, 'q1', 'o1')).rejects.toBeInstanceOf(
        PollNotFoundError,
      );
      expect(repository.vote).not.toHaveBeenCalled();
    });

    it("refuses an option that isn't part of the poll", async () => {
      const repository = mock<QuackRepository>();
      repository.getPollOptionIds.mockResolvedValue({
        pollId: 'p1',
        optionIds: ['o1', 'o2'],
      });

      const service = new QuacksService(repository);

      await expect(
        service.vote(user, 'q1', 'other-polls-option'),
      ).rejects.toBeInstanceOf(PollOptionNotFoundError);
      expect(repository.vote).not.toHaveBeenCalled();
    });
  });
});
