/**
 * Audit API service
 */

import { BaseApiClient } from '../client'
import type {
  ListAuditLogsQueryDto,
  ListAuditLogsResponseDto,
  ExportAuditLogsQueryDto,
  ClearOldLogsRequestDto,
  ClearOldLogsResponseDto,
  GetAuditLogResponseDto,
  AuditSummaryResponseDto,
  AuditActivityResponseDto,
  AuditDistributionResponseDto,
  ApiResponse,
} from '@/types'

export class AuditApiService extends BaseApiClient {
  /**
   * Get audit logs with pagination and filtering
   */
  async getAuditLogs(params?: ListAuditLogsQueryDto): Promise<ApiResponse<ListAuditLogsResponseDto>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.userId) searchParams.append('userId', params.userId)
    if (params?.action) searchParams.append('action', params.action)
    if (params?.resourceType) searchParams.append('resourceType', params.resourceType)
    if (params?.resourceId) searchParams.append('resourceId', params.resourceId)
    if (params?.startDate) searchParams.append('startDate', params.startDate)
    if (params?.endDate) searchParams.append('endDate', params.endDate)
    if (params?.search) searchParams.append('search', params.search)

    const query = searchParams.toString()
    return this.get<ListAuditLogsResponseDto>(`/audit${query ? `?${query}` : ''}`)
  }

  /**
   * Get audit summary KPIs
   */
  async getAuditSummary(): Promise<ApiResponse<AuditSummaryResponseDto>> {
    return this.get<AuditSummaryResponseDto>('/audit/summary')
  }

  /**
   * Get audit activity chart data
   */
  async getAuditActivity(range: 'last7' | 'lastMonth' | 'byWeek' | 'byMonth'): Promise<ApiResponse<AuditActivityResponseDto>> {
    const pathMap = {
      last7: '/audit/charts/activity/last-7-days',
      lastMonth: '/audit/charts/activity/last-month',
      byWeek: '/audit/charts/activity/by-week',
      byMonth: '/audit/charts/activity/by-month'
    }
    return this.get<AuditActivityResponseDto>(pathMap[range])
  }

  /**
   * Get audit distribution chart data
   */
  async getAuditDistribution(range: 'all' | 'lastMonth'): Promise<ApiResponse<AuditDistributionResponseDto>> {
    const pathMap = {
      all: '/audit/charts/distribution/all-time',
      lastMonth: '/audit/charts/distribution/last-month'
    }
    return this.get<AuditDistributionResponseDto>(pathMap[range])
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(params: ExportAuditLogsQueryDto): Promise<{ blob: Blob; filename: string }> {
    const response = await fetch(`${this.baseUrl}/audit/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to export audit logs'
      try {
        const data = await response.json()
        errorMessage = data?.error || errorMessage
      } catch {
        // ignore
      }
      throw new Error(errorMessage)
    }

    const blob = await response.blob()
    const contentDisposition = response.headers.get('Content-Disposition')
    const filenameMatch = contentDisposition?.match(/filename=\"?([^\";]+)\"?/)
    const filename = filenameMatch?.[1] || 'audit-logs.json'

    return { blob, filename }
  }

  /**
   * Get audit log by ID
   */
  async getAuditLog(id: string): Promise<ApiResponse<GetAuditLogResponseDto>> {
    return this.get<GetAuditLogResponseDto>(`/audit/${id}`)
  }

  /**
   * Clear old audit logs
   */
  async clearOldLogs(data: ClearOldLogsRequestDto): Promise<ApiResponse<ClearOldLogsResponseDto>> {
    return this.post<ClearOldLogsResponseDto>('/audit/clear', data)
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(params?: {
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<{
    totalLogs: number
    actionsByType: Record<string, number>
    usersByActivity: Record<string, number>
    resourcesByAccess: Record<string, number>
    errorRate: number
  }>> {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.append('startDate', params.startDate)
    if (params?.endDate) searchParams.append('endDate', params.endDate)

    const query = searchParams.toString()
    return this.get<{
      totalLogs: number
      actionsByType: Record<string, number>
      usersByActivity: Record<string, number>
      resourcesByAccess: Record<string, number>
      errorRate: number
    }>(`/audit/stats${query ? `?${query}` : ''}`)
  }
}
