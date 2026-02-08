/**
 * Settings React hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SettingsApiService } from '../services/settings'
import type {
  UpdateSystemSettingRequestDto,
} from '@/types'

const settingsApi = new SettingsApiService()

/**
 * Hook for getting system settings
 */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for updating system setting
 */
export function useUpdateSetting() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: UpdateSystemSettingRequestDto }) => 
      settingsApi.updateSetting(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

/**
 * Hook for resetting settings
 */
export function useResetSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => settingsApi.resetSettings(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

/**
 * Hook for getting public settings
 */
export function usePublicSettings() {
  return useQuery({
    queryKey: ['settings', 'public'],
    queryFn: () => settingsApi.getPublicSettings(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: false,
  })
}
