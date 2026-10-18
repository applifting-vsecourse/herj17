import type { Poll } from "@/features/quack/api/quackSchemas"

// What the poll looks like once my vote moves to `optionId`: the old option
// loses a vote, the new one gains it, and the total only grows on a first vote.
// Used to show a vote straight away, before the server confirms it.
export function applyVote(poll: Poll, optionId: string): Poll {
  const previous = poll.myVoteOptionId
  if (previous === optionId) return poll

  return {
    ...poll,
    myVoteOptionId: optionId,
    totalVotes: previous ? poll.totalVotes : poll.totalVotes + 1,
    options: poll.options.map((option) => {
      if (option.id === optionId) return { ...option, votes: option.votes + 1 }
      if (option.id === previous) return { ...option, votes: option.votes - 1 }
      return option
    }),
  }
}
