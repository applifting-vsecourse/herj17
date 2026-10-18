export const quackKeys = {
  all: () => ["quacks"] as const,
  lists: () => [...quackKeys.all(), "list"] as const,
  votes: () => [...quackKeys.all(), "vote"] as const,
}
