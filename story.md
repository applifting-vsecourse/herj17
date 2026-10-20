# User story: Moderators can delete any quack

> "Someone started posting nasty quacks. Their author won't delete them and right now we can't do anything about it. We need a moderator who can delete anything. Nothing more for now."

**As a** moderator (a user with the `admin` role),
**I want to** delete any quack in the feed, not only my own,
**so that** nasty posts come down even when their author refuses to remove them.

---

## Acceptance criteria

1. A signed-in admin can delete any quack, whoever wrote it: `DELETE /api/quacks/:quackId` answers **204** and the quack (with its poll and votes) is gone for everyone.
2. Nothing changes for everyone else: a regular user can still delete only their own quacks and gets **403** "You can only delete your own quacks" for anyone else's.
3. A quack that doesn't exist, or was deleted in the meantime, still answers **404**, for admins as well.
4. Not signed in still answers **401**.
5. In the feed, an admin sees the **Delete** action on every quack. A regular user sees it only on their own quacks, as before.
6. Admins use the same confirmation dialog as authors. Nothing is deleted until they confirm.
7. Whether someone is an admin is read from their session on the server for each request. It is never taken from the request body or decided by the UI.

---

## Decisions (made by the agent: the brief said "nothing more for now")

- **Moderator = `admin` role.** The role and the seeded account already exist (`admin@example.com` / `adminpassword`). No new role, no way to grant the role from the app.
- **Same endpoint, same button.** No separate moderation endpoint or screen. The existing delete flow gets an "owner **or** admin" rule.
- **Hard delete, like an author's delete.** The quack, its poll and its votes are removed. There is no soft delete or "removed by a moderator" placeholder.
- **Same dialog text.** An admin deleting someone else's quack sees the same "Delete this quack?" confirmation.

## Out of scope

- An audit log of who deleted what.
- Notifying the author that their quack was removed.
- Banning, muting or suspending users.
- Reporting/flagging quacks, or a moderation queue.
- Editing other people's quacks.
- Managing roles (promoting or demoting admins) from the app.

---

## Verification

- Unit tests: the service lets the owner and an admin delete, and refuses anyone else.
- Manual review with three accounts: the author, someone else, `admin@example.com`. Then Swagger.
- E2E test (`pnpm backend test:e2e`, against the running app): a regular user gets 403 on someone else's quack, the admin deletes it (204), and it is gone. Breaking the service check must make this test fail.
