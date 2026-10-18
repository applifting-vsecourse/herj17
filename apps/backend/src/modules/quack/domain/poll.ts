export type PollOption = {
  id: string;
  text: string;
  // computed from stored votes, never sent by a client
  votes: number;
};

export type Poll = {
  id: string;
  options: PollOption[];
  totalVotes: number;
  // the option the viewer voted for, if they did
  myVoteOptionId?: string;
};

export class PollNotFoundError extends Error {
  constructor(quackId: string) {
    super(`Quack ${quackId} has no poll`);
  }
}

export class PollOptionNotFoundError extends Error {
  constructor(optionId: string) {
    super(`Option ${optionId} is not part of this poll`);
  }
}
