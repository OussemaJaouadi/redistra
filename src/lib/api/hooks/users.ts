/**
 * Users React hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UsersApiService } from '../services/users'
import type {
  CreateUserRequestDto,
  UpdateUserRequestDto,
} from '@/types'

const usersApi = new UsersApiService()

/**
 * Hook for getting users list
 */
export function useUsers(params?: {
  page?: number
  limit?: number
  search?: string
  role?: string
  isActive?: boolean
}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.getUsers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for getting single user
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for creating user
 */
export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateUserRequestDto) => usersApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

/**
 * Hook for updating user
 */
export function useUpdateUser(id: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UpdateUserRequestDto) => usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', id] })
    },
  })
}

/**
 * Hook for deleting user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

/**
 * Hook for toggling user status
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => usersApi.toggleUserStatus(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', id] })
    },
  })
}

/**
 * Hook for resetting user password
 */
export function useResetPassword() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) => 
      usersApi.resetPassword(id, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
