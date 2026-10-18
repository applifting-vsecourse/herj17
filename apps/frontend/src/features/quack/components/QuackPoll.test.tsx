import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Poll, Quack } from "@/features/quack/api/quackSchemas"
import { vote } from "@/features/quack/api/vote"
import { QuackPoll } from "@/features/quack/components/QuackPoll"

vi.mock("@/features/quack/api/vote", () => ({ vote: vi.fn() }))

const poll = (overrides: Partial<Poll> = {}): Poll => ({
  id: "p1",
  options: [
    { id: "o1", text: "Pizza", votes: 1 },
    { id: "o2", text: "Sushi", votes: 0 },
  ],
  totalVotes: 1,
  ...overrides,
})

const quackWith = (initial: Poll): Quack => ({
  id: "q1",
  text: "Lunch?",
  userId: "u1",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
  poll: initial,
})

// Reads the poll from the feed cache, the way QuackItem gets it.
function PollFromFeed() {
  const { data } = useQuery({
    queryKey: quackKeys.lists(),
    queryFn: () => new Promise<Quack[]>(() => undefined),
    staleTime: Infinity,
  })
  const quack = data?.[0]
  return quack?.poll ? (
    <QuackPoll
      quackId={quack.id}
      poll={quack.poll}
    />
  ) : null
}

const renderPoll = (initial = poll()) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(quackKeys.lists(), [quackWith(initial)])
  render(
    <QueryClientProvider client={queryClient}>
      <PollFromFeed />
    </QueryClientProvider>,
  )
}

const answer = (name: RegExp) => screen.getByRole("button", { name })

describe("QuackPoll", () => {
  beforeEach(() => {
    vi.mocked(vote).mockReset()
  })

  it("shows every answer with its count and percentage", () => {
    renderPoll()

    expect(answer(/^Pizza, 1 vote, 100%/)).toBeInTheDocument()
    expect(answer(/^Sushi, 0 votes, 0%/)).toBeInTheDocument()
    expect(screen.getByText("1 vote")).toBeInTheDocument()
  })

  it("marks my answer", () => {
    renderPoll(poll({ myVoteOptionId: "o1" }))

    expect(answer(/^Pizza/)).toHaveAttribute("aria-pressed", "true")
    expect(answer(/^Sushi/)).toHaveAttribute("aria-pressed", "false")
  })

  it("shows my vote straight away, before the server answers", async () => {
    vi.mocked(vote).mockReturnValue(new Promise(() => undefined))
    renderPoll()

    await userEvent.click(answer(/^Sushi/))

    expect(answer(/^Sushi, 1 vote, 50%/)).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("2 votes")).toBeInTheDocument()
    expect(vote).toHaveBeenCalledWith({ quackId: "q1", optionId: "o2" })
  })

  it("puts the poll back and says so when the vote doesn't go through", async () => {
    vi.mocked(vote).mockRejectedValue(new Error("Server unreachable"))
    renderPoll()

    await userEvent.click(answer(/^Sushi/))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your vote wasn't saved: Server unreachable",
    )
    expect(answer(/^Sushi, 0 votes/)).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByText("1 vote")).toBeInTheDocument()
  })

  it("doesn't send a vote for my current answer", async () => {
    renderPoll(poll({ myVoteOptionId: "o1" }))

    await userEvent.click(answer(/^Pizza/))

    expect(vote).not.toHaveBeenCalled()
  })
})
