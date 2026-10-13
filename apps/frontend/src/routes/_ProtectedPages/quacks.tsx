import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { quacksQueryOptions } from "@/features/quack/api/quacksQueryOptions"
import { QuackForm } from "@/features/quack/components/QuackForm"
import { QuackList } from "@/features/quack/components/QuackList"

export const Route = createFileRoute("/_ProtectedPages/quacks")({
  component: QuacksPage,
})

function QuacksPage() {
  const quacksQuery = useQuery(quacksQueryOptions())
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

        <QuackForm className="mb-4" />

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
