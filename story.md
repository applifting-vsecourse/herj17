# User story: Filter the quack feed

**As a** signed-in reader,
**I want to** type a word or a name into a search box above the feed and see only matching quacks,
**so that** I can find a specific post I remember without scrolling through everything.

---

## Acceptance criteria

1. A text input labelled **"Search quacks"** is visible above the feed on the quacks page when the feed has loaded.
2. Typing into the input immediately narrows the list to quacks whose text contains the typed string, case-insensitively.
3. Typing into the input also matches quacks whose author's display name contains the typed string, case-insensitively.
4. Clearing the input (emptying it) restores the full unfiltered feed.
5. When the filter is active and no quack matches, the feed area shows the message **"No quacks match your search."** instead of a blank area.
6. The search input is not present while the feed is still loading or in an error state.

---

## Out of scope

- Matching on username (handle) — display name only for now.
- Highlighting the matched word inside a result.
- Persisting the search term across navigation or page reloads.
- A dedicated search page or route.
- Server-side / API search — filtering runs on the already-loaded list in the browser.
- Searching content other than quacks (users, etc.).

---

## Notes

Filtering is purely client-side: no new endpoint, no debounce requirement, no pagination concern. The feed is small enough that this is fine for the experiment. If usage data shows people searching heavily, a server-side endpoint is the natural next step — but that is a separate story.
