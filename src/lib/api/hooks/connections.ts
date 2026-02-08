/**
 * Connections React hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConnectionsApiService } from '../services/connections'
import type {
  CreateConnectionRequestDto,
  UpdateConnectionRequestDto,
  TestConnectionRequestDto,
  ApiResponse,
  ListConnectionsResponseDto,
} from '@/types'

const connectionsApi = new ConnectionsApiService()

/**
 * Hook for getting connections list
 */
export function useConnections() {
  return useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsApi.getConnections(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting single connection
 */
export function useConnection(id: string) {
  return useQuery({
    queryKey: ['connections', id],
    queryFn: () => connectionsApi.getConnection(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting connection secret (password)
 */
export function useConnectionSecret(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['connections', id, 'secret'],
    queryFn: () => connectionsApi.getConnectionSecret(id),
    enabled: enabled && !!id,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook for creating connection
 */
export function useCreateConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateConnectionRequestDto) => connectionsApi.createConnection(data),
    onMutate: async (newConnection) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['connections'] })

      // Snapshot previous value
      const previousConnections = queryClient.getQueryData(['connections'])

      // Optimistically update
      queryClient.setQueryData(['connections'], (old: ApiResponse<ListConnectionsResponseDto> | undefined) => {
        if (!old?.data?.connections) return old

        // Create a temporary optimistic connection object
        const optimisticConnection = {
          id: 'temp-' + Date.now(),
          ...newConnection,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Default values for fields not in creation DTO
          port: 'port' in newConnection ? newConnection.port : 6379,
          lastStatus: 'unknown',
          lastError: null,
          lastUsed: null,
          ownerId: 'current-user', // wrapper should handle this
          database: 'database' in newConnection ? newConnection.database : 0,
          useTls: 'useTls' in newConnection ? newConnection.useTls : false,
          isShared: false,
          description: newConnection.description || null,
          username: 'username' in newConnection ? newConnection.username : null,
        }

        return {
          ...old,
          data: {
            ...old.data,
            connections: {
              ...old.data.connections,
              my: [optimisticConnection, ...old.data.connections.my]
            }
          }
        }
      })

      return { previousConnections }
    },
    onError: (err, newConnection, context) => {
      queryClient.setQueryData(['connections'], context?.previousConnections)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
  })
}

/**
 * Hook for updating connection
 */
export function useUpdateConnection(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateConnectionRequestDto) => connectionsApi.updateConnection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
      queryClient.invalidateQueries({ queryKey: ['connections', id] })
    },
  })
}

/**
 * Hook for deleting connection
 */
export function useDeleteConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => connectionsApi.deleteConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
  })
}

/**
 * Hook for testing connection
 */
export function useTestConnection() {
  return useMutation({
    mutationFn: (data: TestConnectionRequestDto) => connectionsApi.testConnection(data),
  })
}

/**
 * Hook for connecting to existing connection
 */
export function useConnectConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => connectionsApi.connect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
  })
}

/**
 * Hook for testing existing connection
 */
export function useTestExistingConnection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => connectionsApi.testExistingConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
  })
}

/**
 * Hook for getting connection status
 */
export function useConnectionStatus(id: string) {
  return useQuery({
    queryKey: ['connections', id, 'status'],
    queryFn: () => connectionsApi.getConnectionStatus(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  })
}
