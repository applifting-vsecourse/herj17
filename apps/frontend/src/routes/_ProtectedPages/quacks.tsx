import { useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useSession } from "@/features/auth/hooks/useSession"
import { profileQueryOptions } from "@/features/profile/api/profileQueryOptions"
import { quacksQueryOptions } from "@/features/quack/api/quacksQueryOptions"
import { QuackForm, type QuackFormHandle } from "@/features/quack/components/QuackForm"
import { QuackList } from "@/features/quack/components/QuackList"

const FEEDS = ["all", "mine"] as const

const quacksSearchParamsSchema = z.object({
  // the tab lives in the URL so it survives a reload and can be linked to
  feed: z.enum(FEEDS).optional().catch(undefined),
})

export const Route = createFileRoute("/_ProtectedPages/quacks")({
  validateSearch: quacksSearchParamsSchema,
  // Prefetch so the post form opens with the default mood already selected.
  // prefetchQuery never throws: if the profile fails, the form starts with no mood.
  loader: ({ context }) => context.queryClient.prefetchQuery(profileQueryOptions()),
  component: QuacksPage,
})

function QuacksPage() {
  const quacksQuery = useQuery(quacksQueryOptions())
  const defaultMood = useQuery(profileQueryOptions()).data?.defaultMood
  const viewer = useSession().user
  const { feed = "all" } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [search, setSearch] = useState("")
  const quackFormRef = useRef<QuackFormHandle>(null)

  const allQuacks = quacksQuery.data ?? []
  const feedQuacks =
    feed === "mine" ? allQuacks.filter((quack) => quack.userId === viewer?.id) : allQuacks
  const needle = search.trim().toLowerCase()
  const visibleQuacks = needle
    ? feedQuacks.filter(
        (q) => q.text.toLowerCase().includes(needle) || q.user.name.toLowerCase().includes(needle),
      )
    : feedQuacks

  const isFeedReady = !quacksQuery.isLoading && !quacksQuery.error

  const list = (
    <QuackList
      quacks={visibleQuacks}
      isLoading={quacksQuery.isLoading}
      error={quacksQuery.error ?? undefined}
      isFiltered={needle.length > 0}
      onReload={() => void quacksQuery.refetch()}
      viewerId={viewer?.id}
      isModerator={viewer?.role === "admin"}
      emptyState={
        feed === "mine" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">You haven&apos;t posted any quacks yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => quackFormRef.current?.focus()}
            >
              Write your first quack
            </Button>
          </div>
        ) : undefined
      }
    />
  )

  return (
    <>
      <Seo title="Quacks" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Quacks</h1>

        <QuackForm
          ref={quackFormRef}
          // remount when the default mood changes so the form picks it up
          key={defaultMood ?? "none"}
          className="mb-6"
          defaultMood={defaultMood}
        />

        <Tabs
          value={feed}
          onValueChange={(value) =>
            void navigate({
              search: (prev) => ({ ...prev, feed: value === "mine" ? "mine" : undefined }),
              replace: true,
            })
          }
          className="gap-4"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mine">Mine</TabsTrigger>
          </TabsList>

          {isFeedReady ? (
            <div className="space-y-1">
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

          {FEEDS.map((value) => (
            <TabsContent
              key={value}
              value={value}
            >
              {list}
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </>
  )
}
