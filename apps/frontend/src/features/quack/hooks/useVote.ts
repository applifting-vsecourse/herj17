import { useMutation, useQueryClient } from "@tanstack/react-query"

import { applyVote } from "@/features/quack/api/applyVote"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Poll, Quack } from "@/features/quack/api/quackSchemas"
import { vote } from "@/features/quack/api/vote"

const setPoll = (quacks: Quack[] | undefined, quackId: string, update: (poll: Poll) => Poll) =>
  quacks?.map((quack) =>
    quack.id === quackId && quack.poll ? { ...quack, poll: update(quack.poll) } : quack,
  )

// Optimistic: the vote shows in the feed at once and is rolled back if the
// server refuses it. The component shows the error.
export function useVote(quackId: string) {
  const queryClient = useQueryClient()
  const isLastVoteInFlight = () => queryClient.isMutating({ mutationKey: quackKeys.votes() }) === 1

  return useMutation({
    mutationKey: quackKeys.votes(),
    // Votes in one poll reach the server in the order they were clicked, so the
    // last click wins there too. Each still shows straight away: onMutate isn't
    // queued, only the request is.
    scope: { id: `vote-${quackId}` },
    mutationFn: (optionId: string) => vote({ quackId, optionId }),
    onMutate: async (optionId) => {
      // an in-flight refetch would land after this and wipe out the vote
      await queryClient.cancelQueries({ queryKey: quackKeys.lists() })

      const previousPoll = queryClient
        .getQueryData<Quack[]>(quackKeys.lists())
        ?.find((quack) => quack.id === quackId)?.poll

      queryClient.setQueryData<Quack[]>(quackKeys.lists(), (quacks) =>
        setPoll(quacks, quackId, (poll) => applyVote(poll, optionId)),
      )

      return { previousPoll }
    },
    onError: (_error, _optionId, context) => {
      const previousPoll = context?.previousPoll
      if (!previousPoll) return
      queryClient.setQueryData<Quack[]>(quackKeys.lists(), (quacks) =>
        setPoll(quacks, quackId, () => previousPoll),
      )
    },
    onSuccess: (poll) => {
      // A later click is still on its way; showing this answer would flash
      // the poll back to an older vote.
      if (!isLastVoteInFlight()) return
      // the server's counts include everyone else's votes too
      queryClient.setQueryData<Quack[]>(quackKeys.lists(), (quacks) =>
        setPoll(quacks, quackId, () => poll),
      )
    },
    onSettled: () => {
      // Not awaited: the vote is settled now, and its error must show without
      // waiting for the whole feed to reload.
      if (isLastVoteInFlight()) {
        void queryClient.invalidateQueries({ queryKey: quackKeys.lists() })
      }
    },
  })
}
