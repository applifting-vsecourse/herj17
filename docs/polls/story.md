# User story: Polls in quacks

**As a** signed-in user,
**I want to** ask a question with a few answers to choose from in a quack, and let everyone else pick one,
**so that** nobody has to count replies by hand and everyone sees the same, correct numbers.

---

## Acceptance criteria

### Asking

1. The post form has an **"Add poll"** button. Pressing it shows two answer fields, labelled **"Option 1"** and **"Option 2"**.
2. The quack text is the question. A poll can't be posted without it — the same rule as any quack.
3. A poll has **2–4 answers**. **"Add option"** adds another field until there are 4; each field beyond the first two has a **remove** button. **"Remove poll"** drops the whole poll and the post becomes a plain quack again.
4. Each answer is **1–50 characters** after trimming. Two answers can't be the same (case-insensitive). Every error is written out under the field it belongs to.
5. After posting, the form goes back to a plain quack (no poll).
6. A poll can't be edited after it is posted (quacks can't be edited either).

### Voting

7. A quack with a poll shows its answers under the text. Each answer shows its **vote count and percentage** and a bar, and the total number of votes is shown below the answers.
8. Results are visible to everyone, before and after voting, including the author.
9. Pressing an answer casts my vote. **One person, one vote** per poll: pressing another answer moves my vote there; pressing my current answer does nothing. There is no "retract vote".
10. My current answer is marked (visually and for screen readers).
11. The author can vote in their own poll.

### Feels instant, and failures are visible

12. When I vote, the counts and my marked answer update immediately, without waiting for the server.
13. If the vote doesn't go through, the poll goes back to what it was before and I see an error message saying my vote wasn't saved.
14. While the feed is refreshing, a vote I've just cast isn't overwritten by stale data.

### Correct for everyone

15. Counts are computed by the server from stored votes, never sent by the client. Another user sees my vote after a reload (or when their tab regains focus).
16. The database itself guarantees one vote per person per poll, and that a vote can only point to an answer of that same poll.

---

## Decisions made (were open, closed here)

| Question                                | Decision                                                                   |
| --------------------------------------- | -------------------------------------------------------------------------- |
| Separate question field, or quack text? | Quack text is the question — fewer fields, poll is "a quack with answers". |
| How many answers?                       | 2–4.                                                                       |
| Answer length?                          | 1–50 characters.                                                           |
| Can I see results before voting?        | Yes, always.                                                               |
| Can I retract my vote?                  | No — only change it.                                                       |
| Can the author vote?                    | Yes.                                                                       |
| Does a poll close / expire?             | No.                                                                        |
| Who voted for what?                     | Not shown — only counts.                                                   |
| Live updates (websockets)?              | No — reload / refetch on focus is enough for the experiment.               |

## Out of scope

- Closing polls, deadlines, multiple choice, anonymous vs. public votes, editing or deleting polls.
- Real-time push of new votes.
- Polls anywhere other than the quack feed.
