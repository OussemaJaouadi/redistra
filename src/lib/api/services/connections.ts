/**
 * Connections API service
 */

import { BaseApiClient } from '../client'
import type {
  CreateConnectionRequestDto,
  CreateConnectionResponseDto,
  UpdateConnectionRequestDto,
  UpdateConnectionResponseDto,
  DeleteConnectionResponseDto,
  GetConnectionResponseDto,
  GetConnectionSecretResponseDto,
  ListConnectionsResponseDto,
  TestConnectionRequestDto,
  TestConnectionResponseDto,
  ApiResponse,
} from '@/types'

export class ConnectionsApiService extends BaseApiClient {
  /**
   * Get all connections
   */
  async getConnections(): Promise<ApiResponse<ListConnectionsResponseDto>> {
    return this.get<ListConnectionsResponseDto>('/connections')
  }

  /**
   * Get connection by ID
   */
  async getConnection(id: string): Promise<ApiResponse<GetConnectionResponseDto>> {
    return this.get<GetConnectionResponseDto>(`/connections/${id}`)
  }

  /**
   * Get connection secret (password)
   */
  async getConnectionSecret(id: string): Promise<ApiResponse<GetConnectionSecretResponseDto>> {
    return this.get<GetConnectionSecretResponseDto>(`/connections/${id}/secret`)
  }

  /**
   * Create new connection
   */
  async createConnection(data: CreateConnectionRequestDto): Promise<ApiResponse<CreateConnectionResponseDto>> {
    return this.post<CreateConnectionResponseDto>('/connections', data)
  }

  /**
   * Update connection
   */
  async updateConnection(
    id: string,
    data: UpdateConnectionRequestDto
  ): Promise<ApiResponse<UpdateConnectionResponseDto>> {
    return this.patch<UpdateConnectionResponseDto>(`/connections/${id}`, data)
  }

  /**
   * Delete connection
   */
  async deleteConnection(id: string): Promise<ApiResponse<DeleteConnectionResponseDto>> {
    return this.delete<DeleteConnectionResponseDto>(`/connections/${id}`)
  }

  /**
   * Test connection
   */
  async testConnection(data: TestConnectionRequestDto): Promise<ApiResponse<TestConnectionResponseDto>> {
    return this.post<TestConnectionResponseDto>('/connections/test', data)
  }

  /**
   * Test existing connection by ID
   */
  async testExistingConnection(id: string): Promise<ApiResponse<TestConnectionResponseDto>> {
    return this.post<TestConnectionResponseDto>(`/connections/${id}/test`)
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(id: string): Promise<ApiResponse<{ status: 'connected' | 'disconnected' | 'error', lastChecked: string }>> {
    return this.get<{ status: 'connected' | 'disconnected' | 'error', lastChecked: string }>(`/connections/${id}/status`)
  }

  /**
   * Connect to Redis (updates lastUsed/lastStatus)
   */
  async connect(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>(`/connections/${id}/connect`)
  }
}
