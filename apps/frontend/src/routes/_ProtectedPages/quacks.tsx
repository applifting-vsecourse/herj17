import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { profileQueryOptions } from "@/features/profile/api/profileQueryOptions"
import { quacksQueryOptions } from "@/features/quack/api/quacksQueryOptions"
import { QuackForm } from "@/features/quack/components/QuackForm"
import { QuackList } from "@/features/quack/components/QuackList"

export const Route = createFileRoute("/_ProtectedPages/quacks")({
  // Prefetch so the post form opens with the default mood already selected.
  // prefetchQuery never throws: if the profile fails, the form starts with no mood.
  loader: ({ context }) => context.queryClient.prefetchQuery(profileQueryOptions()),
  component: QuacksPage,
})

function QuacksPage() {
  const quacksQuery = useQuery(quacksQueryOptions())
  const defaultMood = useQuery(profileQueryOptions()).data?.defaultMood
  const [search, setSearch] = useState("")

  const allQuacks = quacksQuery.data ?? []
  const needle = search.trim().toLowerCase()
  const visibleQuacks = needle
    ? allQuacks.filter(
        (q) => q.text.toLowerCase().includes(needle) || q.user.name.toLowerCase().includes(needle),
      )
    : allQuacks

  const isFeedReady = !quacksQuery.isLoading && !quacksQuery.error

  return (
    <>
      <Seo title="Quacks" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Quacks</h1>

        <QuackForm
          // remount when the default mood changes so the form picks it up
          key={defaultMood ?? "none"}
          className="mb-4"
          defaultMood={defaultMood}
        />

        {isFeedReady ? (
          <div className="mb-4 space-y-1">
            <Label htmlFor="quack-search">Search quacks</Label>
            <Input
              id="quack-search"
              type="search"
              placeholder="Search by content or author…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        ) : null}

        <QuackList
          quacks={visibleQuacks}
          isLoading={quacksQuery.isLoading}
          error={quacksQuery.error ?? undefined}
          isFiltered={needle.length > 0}
          onReload={() => void quacksQuery.refetch()}
        />
      </section>
    </>
  )
}
