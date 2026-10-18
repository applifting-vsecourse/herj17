import { api } from "@/lib/api-client"
import type { Mood } from "@/lib/moods"

import { profileSchema, type Profile } from "@/features/profile/api/profileSchemas"

export type ProfileInput = {
  name: string
  username: string
  bio: string | null
  defaultMood: Mood | null
}

export async function updateProfile(input: ProfileInput): Promise<Profile> {
  const json = await api.put("profile", { json: input }).json()
  return profileSchema.parse(json)
}
