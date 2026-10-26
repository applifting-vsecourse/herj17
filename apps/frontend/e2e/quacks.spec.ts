import { expect, test, type Page } from "@playwright/test"

import { signIn } from "./signIn"

const API = "http://localhost:4050/api"

type ListedQuack = { id: string; text: string; user: { username: string } }

async function listQuacks(page: Page): Promise<ListedQuack[]> {
  return (await (await page.request.get(`${API}/quacks`)).json()) as ListedQuack[]
}

async function findQuackNotBy(page: Page, username: string): Promise<{ id: string }> {
  const quacks = await listQuacks(page)
  return quacks.find((quack) => quack.user.username !== username)!
}

test("author can post a quack and delete it", async ({ page }) => {
  const text = `E2E quack ${Date.now()}`
  await signIn(page, "caffeinatedduck@example.com", "password1")
  await page.goto("/quacks")

  await page.getByLabel("New quack").fill(text)
  await page.getByRole("button", { name: "Quack", exact: true }).click()
  const quack = page.getByRole("article").filter({ hasText: text })
  await expect(quack).toBeVisible()

  await quack.getByRole("button", { name: "Delete quack" }).click()
  const confirm = page.getByRole("alertdialog")
  await confirm.getByRole("button", { name: "Delete" }).click()
  // the open dialog hides the feed from the accessibility tree, and it stays
  // open on an error, so only check the feed once it has closed
  await expect(confirm).toHaveCount(0)
  await expect(quack).toHaveCount(0)
})

test("nobody can delete someone else's quack", async ({ page }) => {
  await signIn(page, "deepduckthoughts@example.com", "password2")
  await page.goto("/quacks")

  const othersQuack = page.getByRole("article").filter({ hasNotText: "@DeepDuckThoughts" }).first()
  await expect(othersQuack.getByRole("button", { name: "Delete quack" })).toHaveCount(0)

  // The button is hidden. Now skip the UI and ask the server directly.
  const notMine = await findQuackNotBy(page, "DeepDuckThoughts")
  const response = await page.request.delete(`${API}/quacks/${notMine.id}`)
  expect(response.status()).toBe(403)
})

test("admin can delete someone else's quack", async ({ browser }) => {
  const text = `Spam ${Date.now()}`
  // one page holds one session, so the author and the admin each get their own
  const author = await browser.newPage()
  await signIn(author, "caffeinatedduck@example.com", "password1")
  const created = await author.request.post(`${API}/quacks`, { data: { text } })
  expect(created.ok()).toBe(true)

  const admin = await browser.newPage()
  await signIn(admin, "admin@example.com", "adminpassword")
  await admin.goto("/quacks")

  const spam = admin.getByRole("article").filter({ hasText: text })
  await expect(spam).toBeVisible()
  await spam.getByRole("button", { name: "Delete quack" }).click()
  const confirm = admin.getByRole("alertdialog")
  await confirm.getByRole("button", { name: "Delete" }).click()
  await expect(confirm).toHaveCount(0)
  await expect(spam).toHaveCount(0)

  // gone on the server too, not just from the admin's feed
  const remaining = await listQuacks(author)
  expect(remaining.some((quack) => quack.text === text)).toBe(false)
})
