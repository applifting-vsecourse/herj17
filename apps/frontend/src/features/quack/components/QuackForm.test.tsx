import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { addQuack } from "@/features/quack/api/addQuack"
import { QuackForm } from "@/features/quack/components/QuackForm"

vi.mock("@/features/quack/api/addQuack", () => ({ addQuack: vi.fn() }))

const renderForm = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <QuackForm />
    </QueryClientProvider>,
  )

const addPoll = () => userEvent.click(screen.getByRole("button", { name: "Add poll" }))

describe("QuackForm polls", () => {
  beforeEach(() => {
    vi.mocked(addQuack).mockReset()
  })

  it("starts a poll with two answers and the cursor in the first", async () => {
    renderForm()

    await addPoll()

    expect(screen.getByLabelText("Option 1")).toHaveFocus()
    expect(screen.getByLabelText("Option 2")).toBeInTheDocument()
    expect(screen.getByLabelText("Question")).toBeInTheDocument()
  })

  it("allows up to four answers, and removing the extra ones", async () => {
    renderForm()
    await addPoll()

    const addOption = screen.getByRole("button", { name: "Add option" })
    await userEvent.click(addOption)
    await userEvent.click(addOption)

    expect(screen.getByLabelText("Option 4")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add option" })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Remove option 4" }))
    expect(screen.queryByLabelText("Option 4")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remove option 2" })).not.toBeInTheDocument()
  })

  it("posts the question with its answers", async () => {
    vi.mocked(addQuack).mockReturnValue(new Promise(() => undefined))
    renderForm()

    await userEvent.type(screen.getByLabelText("New quack"), "Lunch?")
    await addPoll()
    await userEvent.type(screen.getByLabelText("Option 1"), " Pizza ")
    await userEvent.type(screen.getByLabelText("Option 2"), "Sushi")
    await userEvent.click(screen.getByRole("button", { name: "Quack" }))

    expect(addQuack).toHaveBeenCalledWith(
      { text: "Lunch?", mood: undefined, poll: { options: ["Pizza", "Sushi"] } },
      expect.anything(),
    )
  })

  it("explains empty and duplicate answers under their fields", async () => {
    renderForm()

    await userEvent.type(screen.getByLabelText("New quack"), "Lunch?")
    await addPoll()
    await userEvent.type(screen.getByLabelText("Option 1"), "Pizza")
    await userEvent.click(screen.getByRole("button", { name: "Add option" }))
    await userEvent.type(screen.getByLabelText("Option 3"), "pizza")
    await userEvent.click(screen.getByRole("button", { name: "Quack" }))

    expect(await screen.findByText("Write an answer or remove this option")).toBeInTheDocument()
    expect(screen.getByText("This answer is already in the poll")).toBeInTheDocument()
    expect(screen.getByLabelText("Option 2")).toHaveFocus()
    expect(addQuack).not.toHaveBeenCalled()
  })

  it("goes back to a plain quack when the poll is removed", async () => {
    vi.mocked(addQuack).mockReturnValue(new Promise(() => undefined))
    renderForm()

    await userEvent.type(screen.getByLabelText("New quack"), "hello")
    await addPoll()
    await userEvent.click(screen.getByRole("button", { name: "Remove poll" }))
    await userEvent.click(screen.getByRole("button", { name: "Quack" }))

    expect(screen.queryByLabelText("Option 1")).not.toBeInTheDocument()
    expect(addQuack).toHaveBeenCalledWith(
      { text: "hello", mood: undefined, poll: undefined },
      expect.anything(),
    )
  })
})
