import { z } from "zod"

import { MOODS } from "@/lib/moods"

export const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  bio: z.string().optional(),
  defaultMood: z.enum(MOODS).optional(),
})

export type Profile = z.infer<typeof profileSchema>
