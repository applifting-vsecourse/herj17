import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { HTTPError } from "@/lib/api-client"
import { MOOD_EMOJI, MOODS } from "@/lib/moods"
import { cn } from "@/lib/utils"

import type { Profile } from "@/features/profile/api/profileSchemas"
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile"

// Mirrors the server-side DTO so the user is told before the request is made —
// the server still validates independently.
const BIO_MAX_LENGTH = 160

const MOOD_OPTIONS = ["none", ...MOODS] as const

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(100, "Keep it under 100 characters"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9._]+$/, "Use only letters, numbers, dots and underscores"),
  bio: z.string().trim().max(BIO_MAX_LENGTH, `Keep it under ${BIO_MAX_LENGTH} characters`),
  defaultMood: z.enum(MOOD_OPTIONS),
})

type FormValues = z.infer<typeof schema>

const toFormValues = (profile: Profile): FormValues => ({
  name: profile.name,
  username: profile.username,
  bio: profile.bio ?? "",
  defaultMood: profile.defaultMood ?? "none",
})

type ProfileFormProps = { profile: Profile }

export function ProfileForm({ profile }: ProfileFormProps) {
  const updateProfile = useUpdateProfile()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(profile),
  })

  const bio = useWatch({ control: form.control, name: "bio" })
  const bioLength = bio?.length ?? 0

  const handleSubmit = (values: FormValues) => {
    updateProfile.mutate(
      {
        name: values.name,
        username: values.username,
        bio: values.bio === "" ? null : values.bio,
        defaultMood: values.defaultMood === "none" ? null : values.defaultMood,
      },
      {
        onSuccess: (saved) => {
          // what was just saved becomes the state "discard" goes back to
          form.reset(toFormValues(saved))
          toast.success("Settings saved")
        },
        onError: (error) => {
          if (error instanceof HTTPError && error.response.status === 409) {
            form.setError("username", { message: error.message }, { shouldFocus: true })
          }
        },
      },
    )
  }

  // a taken username is reported next to its field, not in the banner
  const isUsernameConflict =
    updateProfile.error instanceof HTTPError && updateProfile.error.response.status === 409

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6"
      >
        {updateProfile.error && !isUsernameConflict ? (
          <Alert variant="destructive">
            <AlertDescription>{updateProfile.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  spellCheck={false}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                3–30 characters: letters, numbers, dots and underscores.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="e.g. Professional bread critic. Amateur swimmer."
                  {...field}
                />
              </FormControl>
              <div className="flex items-start justify-between gap-3">
                <FormMessage />
                <span
                  className={cn(
                    "ml-auto text-sm",
                    bioLength > BIO_MAX_LENGTH ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {bioLength}/{BIO_MAX_LENGTH}
                </span>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultMood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default mood for new quacks</FormLabel>
              <FormControl>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  // every mood is its own Tab stop here instead of arrow-key navigation
                  rovingFocus={false}
                  value={field.value}
                  // a radio-like choice: clicking the selected item must not clear it
                  onValueChange={(value) => {
                    if (value) field.onChange(value)
                  }}
                  className="flex-wrap"
                >
                  {MOOD_OPTIONS.map((mood) => (
                    <ToggleGroupItem
                      key={mood}
                      value={mood}
                      className="px-3 capitalize"
                    >
                      {mood === "none" ? null : <span aria-hidden="true">{MOOD_EMOJI[mood]}</span>}
                      {mood}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={updateProfile.isPending || !form.formState.isDirty}
            onClick={() => {
              updateProfile.reset()
              form.reset()
            }}
          >
            Discard changes
          </Button>
        </div>
      </form>
    </Form>
  )
}
