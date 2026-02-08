/**
 * Redis Operations React hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RedisApiService } from '../services/redis'
import type {
  CreateKeyRequestDto,
  UpdateKeyRequestDto,
  ListKeysQueryDto,
  RenameKeyRequestDto,
  SetTtlRequestDto,
} from '@/types'

const redisApi = new RedisApiService()

/**
 * Hook for getting Redis keys
 */
export function useRedisKeys(connectionId: string, params?: ListKeysQueryDto) {
  return useQuery({
    queryKey: ['redis', connectionId, 'keys', params],
    queryFn: () => redisApi.getKeys(connectionId, params),
    enabled: !!connectionId,
    staleTime: 10 * 1000, // 10 seconds
  })
}

/**
 * Hook for getting single Redis key
 */
export function useRedisKey(connectionId: string, key: string, db?: number) {
  return useQuery({
    queryKey: ['redis', connectionId, 'keys', key, db],
    queryFn: () => redisApi.getKey(connectionId, key, db),
    enabled: !!connectionId && !!key,
    staleTime: 5 * 1000, // 5 seconds
  })
}

/**
 * Hook for creating Redis key
 */
export function useCreateRedisKey(connectionId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateKeyRequestDto) => redisApi.createKey(connectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redis', connectionId, 'keys'] })
    },
  })
}

/**
 * Hook for updating Redis key
 */
export function useUpdateRedisKey(connectionId: string, key: string, db?: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UpdateKeyRequestDto) => redisApi.updateKey(connectionId, key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redis', connectionId, 'keys'] })
      queryClient.invalidateQueries({ queryKey: ['redis', connectionId, 'keys', key, db] })
    },
  })
}

/**
 * Hook for deleting Redis key
 */
export function useDeleteRedisKey(connectionId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ key, db }: { key: string; db?: number }) => redisApi.deleteKey(connectionId, key, db),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redis', connectionId, 'keys'] })
    },
  })
}

/**
 * Hook for getting Redis databases
 */
export function useRedisDatabases(connectionId: string) {
  return useQuery({
    queryKey: ['redis', connectionId, 'databases'],
    queryFn: () => redisApi.getDatabases(connectionId),
    enabled: !!connectionId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook for getting Redis server info
 */
export function useRedisInfo(connectionId: string) {
  return useQuery({
    queryKey: ['redis', connectionId, 'info'],
    queryFn: () => redisApi.getInfo(connectionId),
    enabled: !!connectionId,
    staleTime: 15 * 1000, // 15 seconds
  })
}

/**
 * Hook for getting database info
 */
export function useDatabaseInfo(connectionId: string, database?: number) {
  return useQuery({
    queryKey: ['redis', connectionId, 'database', 'info', database],
    queryFn: () => redisApi.getDatabaseInfo(connectionId, database),
    enabled: !!connectionId,
    staleTime: 15 * 1000, // 15 seconds
  })
}

/**
 * Hook for switching database
 */
export function useSwitchDatabase(connectionId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (database: number) => redisApi.switchDatabase(connectionId, database),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redis', connectionId] })
    },
  })
}

/**
 * Hook for flushing database
 */
export function useFlushDatabase(connectionId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ database, confirmation }: { database: number; confirmation: string }) =>
      redisApi.flushDatabase(connectionId, database, confirmation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redis', connectionId] })
    },
  })
}

/**
 * Hook for renaming Redis key
 */
export function useRenameRedisKey(connectionId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: RenameKeyRequestDto }) => 
      redisApi.renameKey(connectionId, key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redis', connectionId, 'keys'] })
    },
  })
}

/**
 * Hook for setting Redis key TTL
 */
export function useSetRedisKeyTtl(connectionId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: SetTtlRequestDto }) => 
      redisApi.setTtl(connectionId, key, data),
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['redis', connectionId, 'keys'] })
      queryClient.invalidateQueries({ queryKey: ['redis', connectionId, 'keys', key] })
    },
  })
}
