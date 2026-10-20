import { useImperativeHandle, type Ref } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ListChecks, Loader2, Plus, X } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { MOOD_EMOJI } from "@/lib/moods"
import { cn } from "@/lib/utils"

import { quackMoodSchema, type QuackMood } from "@/features/quack/api/quackSchemas"
import { useAddQuack } from "@/features/quack/hooks/useAddQuack"

// Mirrors the server-side DTO (MaxLength(280)) so the user is told before
// the request is made — the server still validates independently.
const MAX_LENGTH = 280

// Mirrors CreatePollDto on the server.
const POLL_MIN_OPTIONS = 2
const POLL_MAX_OPTIONS = 4
const POLL_OPTION_MAX_LENGTH = 50

const schema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, "Write something first")
      .max(MAX_LENGTH, `Keep it under ${MAX_LENGTH} characters`),
    mood: quackMoodSchema.optional(),
    // empty = a plain quack; useFieldArray needs objects, hence { text }
    pollOptions: z
      .array(
        z.object({
          text: z
            .string()
            .trim()
            .min(1, "Write an answer or remove this option")
            .max(POLL_OPTION_MAX_LENGTH, `Keep it under ${POLL_OPTION_MAX_LENGTH} characters`),
        }),
      )
      .max(POLL_MAX_OPTIONS),
  })
  .superRefine(({ pollOptions }, ctx) => {
    const seen = new Set<string>()
    pollOptions.forEach(({ text }, index) => {
      const key = text.trim().toLowerCase()
      if (key === "") return
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["pollOptions", index, "text"],
          message: "This answer is already in the poll",
        })
      }
      seen.add(key)
    })
  })

type FormValues = z.infer<typeof schema>

export type QuackFormHandle = { focus: () => void }

type QuackFormProps = {
  className?: string
  // pre-selected mood, from the user's settings
  defaultMood?: QuackMood
  ref?: Ref<QuackFormHandle>
}

export function QuackForm({ className, defaultMood, ref }: QuackFormProps) {
  const addQuack = useAddQuack()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { text: "", mood: defaultMood, pollOptions: [] },
  })
  const pollOptions = useFieldArray({ control: form.control, name: "pollOptions" })
  const hasPoll = pollOptions.fields.length > 0

  // lets the page send the user to the compose box, e.g. from an empty feed
  useImperativeHandle(ref, () => ({ focus: () => form.setFocus("text") }), [form])

  const text = useWatch({ control: form.control, name: "text" })
  const length = text?.length ?? 0

  const handleSubmit = (values: FormValues) => {
    addQuack.mutate(
      {
        text: values.text,
        mood: values.mood,
        poll:
          values.pollOptions.length > 0
            ? { options: values.pollOptions.map((option) => option.text) }
            : undefined,
      },
      { onSuccess: () => form.reset() },
    )
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-3", className)}
      >
        {addQuack.error ? (
          <Alert variant="destructive">
            <AlertDescription>{addQuack.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{hasPoll ? "Question" : "New quack"}</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder={hasPoll ? "e.g. Where do we go for lunch?" : "Quack something..."}
                  disabled={addQuack.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasPoll ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Poll answers</legend>
            {pollOptions.fields.map((option, index) => (
              <FormField
                key={option.id}
                control={form.control}
                name={`pollOptions.${index}.text`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option {index + 1}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          disabled={addQuack.isPending}
                          {...field}
                        />
                      </FormControl>
                      {index >= POLL_MIN_OPTIONS ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove option ${index + 1}`}
                          disabled={addQuack.isPending}
                          onClick={() => pollOptions.remove(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <div className="flex flex-wrap items-center gap-2">
              {pollOptions.fields.length < POLL_MAX_OPTIONS ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={addQuack.isPending}
                  onClick={() => pollOptions.append({ text: "" })}
                >
                  <Plus className="size-4" />
                  Add option
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={addQuack.isPending}
                onClick={() => {
                  pollOptions.replace([])
                  // the button that had focus is gone; keep the keyboard in the form
                  form.setFocus("text")
                }}
              >
                Remove poll
              </Button>
            </div>
          </fieldset>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value ?? ""}
                      onValueChange={(val) => field.onChange(val === "" ? undefined : val)}
                      disabled={addQuack.isPending}
                    >
                      {(Object.entries(MOOD_EMOJI) as [QuackMood, string][]).map(
                        ([mood, emoji]) => (
                          <ToggleGroupItem
                            key={mood}
                            value={mood}
                            aria-label={mood}
                            className="text-base"
                          >
                            {emoji}
                          </ToggleGroupItem>
                        ),
                      )}
                    </ToggleGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            {hasPoll ? null : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={addQuack.isPending}
                onClick={() =>
                  pollOptions.append(
                    Array.from({ length: POLL_MIN_OPTIONS }, () => ({ text: "" })),
                    { shouldFocus: true, focusIndex: 0 },
                  )
                }
              >
                <ListChecks className="size-4" />
                Add poll
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-sm",
                length > MAX_LENGTH ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {length}/{MAX_LENGTH}
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={addQuack.isPending}
            >
              {addQuack.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Quack
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
