# Plan: Polls in quacks

Implements [`story.md`](story.md).

## Data model

Three new tables. A poll belongs to exactly one quack; deleting the quack deletes the poll, its options and votes.

```prisma
model Poll {
  id        String       @id @default(cuid())
  quack     Quack        @relation(fields: [quackId], references: [id], onDelete: Cascade)
  quackId   String       @unique          // at most one poll per quack
  options   PollOption[]
  votes     PollVote[]
  createdAt DateTime     @default(now())
}

model PollOption {
  id       String     @id @default(cuid())
  poll     Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  pollId   String
  text     String     @db.VarChar(50)
  position Int                             // display order, 0-based
  votes    PollVote[]

  @@unique([pollId, position])
  @@unique([id, pollId])                   // target of PollVote's composite FK
}

model PollVote {
  poll      Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  pollId    String
  option    PollOption @relation(fields: [optionId, pollId], references: [id, pollId], onDelete: Cascade)
  optionId  String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  createdAt DateTime   @default(now())
  updatedAt DateTime   @default(now()) @updatedAt

  @@id([pollId, userId])                   // ONE VOTE PER PERSON, enforced by the DB
  @@index([optionId])
}
```

How it links: `Quack 1—0..1 Poll 1—n PollOption 1—n PollVote n—1 User`.

Invariants the database enforces (not just the service):

- **One vote per person per poll** — primary key `(pollId, userId)`. Changing a vote is an upsert on that key, so two concurrent clicks can never produce two rows.
- **A vote points at an option of the same poll** — composite foreign key `(optionId, pollId) → PollOption(id, pollId)`.
- **One poll per quack** — `Poll.quackId` is unique.

Counts are always `COUNT(*)` over `PollVote` grouped by option — never a stored counter that could drift.

## Endpoints

| Method | Path                             | Body                                            | Returns                   |
| ------ | -------------------------------- | ----------------------------------------------- | ------------------------- |
| `GET`  | `/api/quacks`                    | —                                               | quacks, each with `poll?` |
| `POST` | `/api/quacks`                    | `{ text, mood?, poll?: { options: string[] } }` | created quack (with poll) |
| `PUT`  | `/api/quacks/:quackId/poll/vote` | `{ optionId }`                                  | the updated poll          |

`poll` in a response:

```json
{
  "id": "…",
  "options": [{ "id": "…", "text": "Pizza", "votes": 3 }],
  "totalVotes": 5,
  "myVoteOptionId": "…"
}
```

`myVoteOptionId` depends on who is asking, so `GET /api/quacks` now takes the signed-in user from the session.

Validation (DTO, mirrored by zod on the client): 2–4 options, each trimmed 1–50 chars, no case-insensitive duplicates.

Errors on vote: `404` quack has no poll, `400` option isn't part of that poll (pre-checked; the composite FK backs it up).

`PUT` because voting is idempotent — sending the same vote twice ends in the same state.

## Frontend

- `quackSchemas.ts` — `pollSchema`, `quack.poll` optional.
- `QuackForm` — "Add poll" toggles a `useFieldArray` of options (Input + label each, remove button with `aria-label`, "Add option" up to 4, "Remove poll").
- `features/quack/components/QuackPoll.tsx` — answers as kit `Button`s with `aria-pressed`, count, percentage, bar; total votes below.
- `features/quack/hooks/useVote.ts` — optimistic update of the quack list cache (`onMutate`: cancel in-flight list queries, snapshot, patch), rollback + error toast in `onError`, invalidate in `onSettled`.

## Build order

1. **Data model** — Prisma schema + migration. Review the schema before anything else.
2. **Create a poll** — DTO validation, repository nested create, response mapping, service test. Frontend: schema + form. Commit.
3. **Show results** — `GET` returns counts + my vote; `QuackPoll` read-only. Seed one example poll. Commit.
4. **Vote** — `PUT …/vote`, service tests (no poll → 404, wrong option → 400, upsert). Frontend: optimistic `useVote`, error rollback, tests. Commit.
5. `pnpm check-all`, run the review checklist in the app with two accounts.
