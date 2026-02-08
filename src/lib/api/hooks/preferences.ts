/**
 * User Preferences React hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PreferencesApiService } from '../services/preferences'
import type {
  UpdateUserPreferenceRequestDto,
} from '@/types'

const preferencesApi = new PreferencesApiService()

/**
 * Hook for getting user preferences
 */
export function usePreferences(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesApi.getPreferences(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false, // Default to true unless explicitly false
  })
}

/**
 * Hook for getting specific preference
 */
export function usePreference(key: string) {
  return useQuery({
    queryKey: ['preferences', key],
    queryFn: () => preferencesApi.getPreference(key),
    enabled: !!key,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for updating user preference
 */
export function useUpdatePreference() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: UpdateUserPreferenceRequestDto }) => 
      preferencesApi.updatePreference(key, data),
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
      queryClient.invalidateQueries({ queryKey: ['preferences', key] })
    },
  })
}

/**
 * Hook for resetting preferences
 */
export function useResetPreferences() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => preferencesApi.resetPreferences(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
    },
  })
}

/**
 * Hook for deleting preference
 */
export function useDeletePreference() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (key: string) => preferencesApi.deletePreference(key),
    onSuccess: (_, key) => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
      queryClient.invalidateQueries({ queryKey: ['preferences', key] })
    },
  })
}
