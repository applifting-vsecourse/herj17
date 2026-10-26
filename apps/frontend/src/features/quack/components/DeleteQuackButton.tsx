import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

import { useDeleteQuack } from "@/features/quack/hooks/useDeleteQuack"

type DeleteQuackButtonProps = { quackId: string }

export function DeleteQuackButton({ quackId }: DeleteQuackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const deleteQuack = useDeleteQuack()

  const handleOpenChange = (isNextOpen: boolean) => {
    // keep the dialog up until the request settles
    if (deleteQuack.isPending) return
    if (isNextOpen) deleteQuack.reset()
    setIsOpen(isNextOpen)
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete quack"
          className="text-muted-foreground"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this quack?</AlertDialogTitle>
          <AlertDialogDescription>
            It disappears from the feed for everyone. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteQuack.error ? (
          <Alert variant="destructive">
            <AlertDescription>{deleteQuack.error.message}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteQuack.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteQuack.isPending}
            onClick={(event) => {
              // the action closes the dialog by default; close it only once deleted
              event.preventDefault()
              deleteQuack.mutate(quackId, { onSuccess: () => setIsOpen(false) })
            }}
          >
            {deleteQuack.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
