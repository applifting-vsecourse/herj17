import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteQuack } from "@/features/quack/api/deleteQuack"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Quack } from "@/features/quack/api/quackSchemas"

export function useDeleteQuack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteQuack,
    onSuccess: async (_data, quackId) => {
      // drop it from the feed straight away, then sync with the server
      queryClient.setQueryData<Quack[]>(quackKeys.lists(), (quacks) =>
        quacks?.filter((quack) => quack.id !== quackId),
      )
      await queryClient.invalidateQueries({ queryKey: quackKeys.all() })
    },
  })
}
