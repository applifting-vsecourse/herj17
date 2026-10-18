import { describe, expect, it } from "vitest"

import { applyVote } from "@/features/quack/api/applyVote"
import type { Poll } from "@/features/quack/api/quackSchemas"

const poll = (overrides: Partial<Poll> = {}): Poll => ({
  id: "p1",
  options: [
    { id: "o1", text: "Pizza", votes: 2 },
    { id: "o2", text: "Sushi", votes: 1 },
  ],
  totalVotes: 3,
  ...overrides,
})

describe("applyVote", () => {
  it("adds a first vote", () => {
    expect(applyVote(poll(), "o2")).toEqual(
      poll({
        options: [
          { id: "o1", text: "Pizza", votes: 2 },
          { id: "o2", text: "Sushi", votes: 2 },
        ],
        totalVotes: 4,
        myVoteOptionId: "o2",
      }),
    )
  })

  it("moves a changed vote without growing the total", () => {
    expect(applyVote(poll({ myVoteOptionId: "o1" }), "o2")).toEqual(
      poll({
        options: [
          { id: "o1", text: "Pizza", votes: 1 },
          { id: "o2", text: "Sushi", votes: 2 },
        ],
        totalVotes: 3,
        myVoteOptionId: "o2",
      }),
    )
  })

  it("leaves the poll alone when voting for my current answer", () => {
    const current = poll({ myVoteOptionId: "o1" })
    expect(applyVote(current, "o1")).toBe(current)
  })
})
