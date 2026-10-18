import { z } from "zod"

import { MOODS } from "@/lib/moods"

// Per the Applifting frontend playbook: validate every server payload with zod
// and infer types from the schema rather than auto-generating them.
export const quackUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
})

export const quackMoodSchema = z.enum(MOODS)
export type QuackMood = z.infer<typeof quackMoodSchema>

export const pollOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  votes: z.number(),
})

export const pollSchema = z.object({
  id: z.string(),
  options: z.array(pollOptionSchema),
  totalVotes: z.number(),
  myVoteOptionId: z.string().optional(),
})

export type Poll = z.infer<typeof pollSchema>

export const quackSchema = z.object({
  id: z.string(),
  text: z.string(),
  mood: quackMoodSchema.optional(),
  userId: z.string(),
  createdAt: z.coerce.date(),
  user: quackUserSchema,
  poll: pollSchema.optional(),
})

export const quacksSchema = z.array(quackSchema)

export type Quack = z.infer<typeof quackSchema>
