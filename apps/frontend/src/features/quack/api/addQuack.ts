import { api } from "@/lib/api-client"

import { quackSchema, type Quack, type QuackMood } from "@/features/quack/api/quackSchemas"

export type AddQuackInput = {
  text: string
  mood?: QuackMood
  // turns the quack into a poll; the text is the question
  poll?: { options: string[] }
}

export async function addQuack(input: AddQuackInput): Promise<Quack> {
  const json = await api.post("quacks", { json: input }).json()
  return quackSchema.parse(json)
}
