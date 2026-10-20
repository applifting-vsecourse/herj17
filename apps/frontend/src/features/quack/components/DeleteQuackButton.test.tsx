import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { deleteQuack } from "@/features/quack/api/deleteQuack"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Quack } from "@/features/quack/api/quackSchemas"
import { DeleteQuackButton } from "@/features/quack/components/DeleteQuackButton"

vi.mock("@/features/quack/api/deleteQuack", () => ({ deleteQuack: vi.fn() }))

const quack: Quack = {
  id: "q1",
  text: "quack quack",
  userId: "u1",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
}

const renderButton = () => {
  const queryClient = new QueryClient()
  queryClient.setQueryData(quackKeys.lists(), [quack])
  render(
    <QueryClientProvider client={queryClient}>
      <DeleteQuackButton quackId="q1" />
    </QueryClientProvider>,
  )
  return queryClient
}

describe("DeleteQuackButton", () => {
  beforeEach(() => {
    vi.mocked(deleteQuack).mockReset()
  })

  it("asks before deleting and does nothing on cancel", async () => {
    renderButton()

    await userEvent.click(screen.getByRole("button", { name: "Delete quack" }))
    expect(screen.getByRole("alertdialog", { name: "Delete this quack?" })).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(deleteQuack).not.toHaveBeenCalled()
  })

  it("removes the quack from the feed once confirmed", async () => {
    vi.mocked(deleteQuack).mockResolvedValue()
    const queryClient = renderButton()

    await userEvent.click(screen.getByRole("button", { name: "Delete quack" }))
    await userEvent.click(screen.getByRole("button", { name: "Delete" }))

    expect(deleteQuack).toHaveBeenCalledWith("q1", expect.anything())
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(queryClient.getQueryData(quackKeys.lists())).toEqual([])
  })

  it("keeps the dialog open and shows the error when deleting fails", async () => {
    vi.mocked(deleteQuack).mockRejectedValue(new Error("You can only delete your own quacks"))
    renderButton()

    await userEvent.click(screen.getByRole("button", { name: "Delete quack" }))
    await userEvent.click(screen.getByRole("button", { name: "Delete" }))

    expect(await screen.findByText("You can only delete your own quacks")).toBeInTheDocument()
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })
})
