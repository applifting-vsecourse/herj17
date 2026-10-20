import { Poll } from '@/modules/quack/domain/poll';

export type QuackAuthor = {
  id: string;
  name: string;
  username: string;
};

export type QuackMood = 'happy' | 'sad' | 'angry' | 'silly';

export type Quack = {
  id: string;
  text: string;
  mood?: QuackMood;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: QuackAuthor;
  poll?: Poll;
};

export class QuackNotFoundError extends Error {
  constructor(quackId: string) {
    super(`Quack ${quackId} does not exist`);
  }
}

export class QuackNotOwnedError extends Error {
  constructor(quackId: string) {
    super(`Quack ${quackId} belongs to someone else`);
  }
}
