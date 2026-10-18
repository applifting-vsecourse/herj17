// Moods are shared by the quack feed and the profile's default mood, so they
// live here rather than inside either feature.
export const MOODS = ["happy", "sad", "angry", "silly"] as const
export type Mood = (typeof MOODS)[number]

export const MOOD_EMOJI: Record<Mood, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  silly: "🤪",
}
