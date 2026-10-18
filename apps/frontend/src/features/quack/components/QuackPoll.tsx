import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { Poll } from "@/features/quack/api/quackSchemas"
import { useVote } from "@/features/quack/hooks/useVote"

const pluralVotes = (count: number) => `${count} ${count === 1 ? "vote" : "votes"}`

type QuackPollProps = { quackId: string; poll: Poll }

export function QuackPoll({ quackId, poll }: QuackPollProps) {
  const vote = useVote(quackId)

  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label="Poll answers"
        className="flex flex-col gap-2"
      >
        {poll.options.map((option) => {
          const isMine = option.id === poll.myVoteOptionId
          const percent =
            poll.totalVotes === 0 ? 0 : Math.round((option.votes / poll.totalVotes) * 100)

          return (
            <Button
              key={option.id}
              type="button"
              variant="outline"
              aria-pressed={isMine}
              aria-label={`${option.text}, ${pluralVotes(option.votes)}, ${percent}%`}
              // pressing my current answer changes nothing, so don't send it
              onClick={() => (isMine ? undefined : vote.mutate(option.id))}
              className={cn(
                "relative h-auto w-full justify-between overflow-hidden py-2 whitespace-normal",
                isMine && "border-primary",
              )}
            >
              {/* the bar: how much of the vote this answer has */}
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 bg-secondary transition-all"
                style={{ width: `${percent}%` }}
              />
              <span className="relative flex items-center gap-2 text-left">
                {isMine ? <Check className="size-4" /> : null}
                {option.text}
              </span>
              <span className="relative text-muted-foreground tabular-nums">
                {option.votes} · {percent}%
              </span>
            </Button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{pluralVotes(poll.totalVotes)}</span>
        {vote.isError ? (
          <span
            role="alert"
            className="text-destructive"
          >
            Your vote wasn&apos;t saved: {vote.error.message}
          </span>
        ) : null}
      </div>
    </div>
  )
}
