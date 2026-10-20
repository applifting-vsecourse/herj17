// Example component test — the pattern to copy for your own components.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { Quack } from "@/features/quack/api/quackSchemas"
import { QuackList } from "@/features/quack/components/QuackList"

const quack = (overrides: Partial<Quack> = {}): Quack => ({
  id: "q1",
  text: "quack quack",
  userId: "u1",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
  ...overrides,
})

describe("QuackList", () => {
  it("renders quacks with author info", () => {
    render(<QuackList quacks={[quack()]} />)

    expect(screen.getByText("quack quack")).toBeInTheDocument()
    expect(screen.getByText("Caffeinated Duck")).toBeInTheDocument()
    expect(screen.getByText("@CaffeinatedDuck")).toBeInTheDocument()
  })

  it("shows an error with a working reload button", async () => {
    const onReload = vi.fn()
    render(
      <QuackList
        quacks={[]}
        error={new Error("Server unreachable")}
        onReload={onReload}
      />,
    )

    expect(screen.getByText("Couldn't load quacks")).toBeInTheDocument()
    expect(screen.getByText("Server unreachable")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /reload/i }))
    expect(onReload).toHaveBeenCalledOnce()
  })

  it("offers Delete only on the viewer's own quacks", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <QuackList
          viewerId="u1"
          quacks={[
            quack(),
            quack({
              id: "q2",
              text: "not mine",
              userId: "u2",
              user: { id: "u2", name: "Other Duck", username: "OtherDuck" },
            }),
          ]}
        />
      </QueryClientProvider>,
    )

    expect(screen.getAllByRole("button", { name: "Delete quack" })).toHaveLength(1)
  })

  it("shows a custom empty state when nothing is filtered out", () => {
    render(
      <QuackList
        quacks={[]}
        emptyState={<p>You haven&apos;t posted any quacks yet.</p>}
      />,
    )

    expect(screen.getByText("You haven't posted any quacks yet.")).toBeInTheDocument()
  })

  it("prefers the search message over the custom empty state", () => {
    render(
      <QuackList
        quacks={[]}
        isFiltered
        emptyState={<p>You haven&apos;t posted any quacks yet.</p>}
      />,
    )

    expect(screen.getByText("No quacks match your search.")).toBeInTheDocument()
  })
})
