import { useMutation, useQueryClient } from "@tanstack/react-query"

import { profileKeys } from "@/features/profile/api/profileKeys"
import { updateProfile } from "@/features/profile/api/updateProfile"

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async (profile) => {
      queryClient.setQueryData(profileKeys.me(), profile)
      // Name and @username appear all over the app (header, every quack in the
      // feed), so refresh everything rather than chasing each query key.
      await queryClient.invalidateQueries()
    },
  })
}
