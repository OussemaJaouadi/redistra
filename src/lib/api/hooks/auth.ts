/**
 * Authentication React hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AuthApiService } from '../services/auth'
import type {
  RegisterRequestDto,
  LoginRequestDto,
} from '@/types'

const authApi = new AuthApiService()

/**
 * Hook for registering a new user
 */
export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterRequestDto) => authApi.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

/**
 * Hook for user login
 */
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginRequestDto) => authApi.login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

/**
 * Hook for refreshing access token
 */
export function useRefresh() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.refresh(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

/**
 * Hook for getting current user
 */
export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}
