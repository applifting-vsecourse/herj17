import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HTTPError, type NormalizedOptions } from "ky"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Profile } from "@/features/profile/api/profileSchemas"
import { updateProfile } from "@/features/profile/api/updateProfile"
import { ProfileForm } from "@/features/profile/components/ProfileForm"

vi.mock("@/features/profile/api/updateProfile", () => ({ updateProfile: vi.fn() }))
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "u1",
  name: "Caffeinated Duck",
  username: "CaffeinatedDuck",
  bio: "Coffee first.",
  defaultMood: "happy",
  ...overrides,
})

const conflict = () => {
  const error = new HTTPError(
    new Response(null, { status: 409 }),
    new Request("http://localhost/api/profile", { method: "PUT" }),
    {} as NormalizedOptions,
  )
  error.message = "That username is already taken"
  return error
}

const renderForm = (initial = profile()) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ProfileForm profile={initial} />
    </QueryClientProvider>,
  )

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.mocked(updateProfile).mockReset()
  })

  it("starts with the saved values", () => {
    renderForm()

    expect(screen.getByLabelText("Display name")).toHaveValue("Caffeinated Duck")
    expect(screen.getByLabelText("Username")).toHaveValue("CaffeinatedDuck")
    expect(screen.getByLabelText("Bio")).toHaveValue("Coffee first.")
    expect(screen.getByRole("radio", { name: /happy/i })).toBeChecked()
  })

  it("rejects a username with characters other than letters, numbers, dots and underscores", async () => {
    renderForm()
    const username = screen.getByLabelText("Username")

    await userEvent.clear(username)
    await userEvent.type(username, "duck-face")
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(
      await screen.findByText("Use only letters, numbers, dots and underscores"),
    ).toBeInTheDocument()
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it("saves the profile, mapping empty values to null", async () => {
    vi.mocked(updateProfile).mockResolvedValue(profile({ username: "new.duck", bio: undefined }))
    renderForm()

    const username = screen.getByLabelText("Username")
    await userEvent.clear(username)
    await userEvent.type(username, "new.duck")
    await userEvent.clear(screen.getByLabelText("Bio"))
    await userEvent.click(screen.getByRole("radio", { name: /none/i }))
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(updateProfile).toHaveBeenCalledWith(
      { name: "Caffeinated Duck", username: "new.duck", bio: null, defaultMood: null },
      expect.anything(),
    )
  })

  it("tells me next to the field when the username is taken and keeps what I typed", async () => {
    vi.mocked(updateProfile).mockRejectedValue(conflict())
    renderForm()

    const username = screen.getByLabelText("Username")
    await userEvent.clear(username)
    await userEvent.type(username, "BreadCritic")
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(await screen.findByText("That username is already taken")).toBeInTheDocument()
    expect(username).toHaveValue("BreadCritic")
    expect(username).toHaveAttribute("aria-invalid", "true")
  })

  it("lets me Tab through every mood", async () => {
    renderForm()

    await userEvent.click(screen.getByLabelText("Bio"))
    for (const mood of ["none", "happy", "sad", "angry", "silly"]) {
      await userEvent.tab()
      expect(screen.getByRole("radio", { name: new RegExp(mood, "i") })).toHaveFocus()
    }
  })

  it("discards my changes back to what is saved", async () => {
    renderForm()

    const name = screen.getByLabelText("Display name")
    await userEvent.clear(name)
    await userEvent.type(name, "Someone Else")
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }))

    expect(name).toHaveValue("Caffeinated Duck")
  })
})
