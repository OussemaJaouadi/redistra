/**
 * Audit React hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AuditApiService } from '../services/audit'
import type {
  ListAuditLogsQueryDto,
  ExportAuditLogsQueryDto,
  ClearOldLogsRequestDto,
} from '@/types'

const auditApi = new AuditApiService()

/**
 * Hook for getting audit logs
 */
export function useAuditLogs(params?: ListAuditLogsQueryDto) {
  return useQuery({
    queryKey: ['audit', 'logs', params],
    queryFn: () => auditApi.getAuditLogs(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook for audit summary KPIs
 */
export function useAuditSummary() {
  return useQuery({
    queryKey: ['audit', 'summary'],
    queryFn: () => auditApi.getAuditSummary(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for activity chart data
 */
export function useAuditActivity(range: 'last7' | 'lastMonth' | 'byWeek' | 'byMonth') {
  return useQuery({
    queryKey: ['audit', 'activity', range],
    queryFn: () => auditApi.getAuditActivity(range),
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook for distribution chart data
 */
export function useAuditDistribution(range: 'all' | 'lastMonth') {
  return useQuery({
    queryKey: ['audit', 'distribution', range],
    queryFn: () => auditApi.getAuditDistribution(range),
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook for getting single audit log
 */
export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ['audit', 'logs', id],
    queryFn: () => auditApi.getAuditLog(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for exporting audit logs
 */
export function useExportAuditLogs() {
  return useMutation({
    mutationFn: (params: ExportAuditLogsQueryDto) => auditApi.exportAuditLogs(params),
  })
}

/**
 * Hook for clearing old audit logs
 */
export function useClearOldLogs() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ClearOldLogsRequestDto) => auditApi.clearOldLogs(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}

/**
 * Hook for getting audit statistics
 */
export function useAuditStats(params?: {
  startDate?: string
  endDate?: string
}) {
  return useQuery({
    queryKey: ['audit', 'stats', params],
    queryFn: () => auditApi.getAuditStats(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
