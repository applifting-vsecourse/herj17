import { api } from "@/lib/api-client"

import { pollSchema, type Poll } from "@/features/quack/api/quackSchemas"

export type VoteInput = { quackId: string; optionId: string }

export async function vote({ quackId, optionId }: VoteInput): Promise<Poll> {
  const json = await api.put(`quacks/${quackId}/poll/vote`, { json: { optionId } }).json()
  return pollSchema.parse(json)
}
