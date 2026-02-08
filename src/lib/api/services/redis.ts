/**
 * Redis Operations API service
 */

import { BaseApiClient } from '../client'
import type {
  GetKeyResponseDto,
  ListKeysResponseDto,
  CreateKeyRequestDto,
  UpdateKeyRequestDto,
  DeleteKeyResponseDto,
  ListKeysQueryDto,
  ListDatabasesResponseDto,
  GetDatabaseInfoResponseDto,
  RedisInfoResponseDto,
  RenameKeyRequestDto,
  RenameKeyResponseDto,
  SetTtlRequestDto,
  SetTtlResponseDto,
  ApiResponse,
} from '@/types'

export class RedisApiService extends BaseApiClient {
  /**
   * Get Redis keys with pagination and filtering
   */
  async getKeys(
    connectionId: string,
    params?: ListKeysQueryDto
  ): Promise<ApiResponse<ListKeysResponseDto>> {
    const searchParams = new URLSearchParams()
    if (params?.pattern) searchParams.append('pattern', params.pattern)
    if (params?.type?.length) {
      params.type.forEach((entry) => searchParams.append('type', entry))
    }
    if (params?.db !== undefined) searchParams.append('db', params.db.toString())
    if (params?.cursor) searchParams.append('cursor', params.cursor)
    if (params?.count) searchParams.append('count', params.count.toString())
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())

    const query = searchParams.toString()
    return this.get<ListKeysResponseDto>(`/redis/${connectionId}/keys${query ? `?${query}` : ''}`)
  }

  /**
   * Get specific key details
   */
  async getKey(
    connectionId: string,
    key: string,
    db?: number
  ): Promise<ApiResponse<GetKeyResponseDto>> {
    const query = db === undefined ? '' : `?db=${db}`
    return this.get<GetKeyResponseDto>(`/redis/${connectionId}/key/${encodeURIComponent(key)}${query}`)
  }

  /**
   * Create new key
   */
  async createKey(
    connectionId: string,
    data: CreateKeyRequestDto
  ): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>(`/redis/${connectionId}/key`, data)
  }

  /**
   * Update key
   */
  async updateKey(
    connectionId: string,
    key: string,
    data: UpdateKeyRequestDto
  ): Promise<ApiResponse<{ message: string }>> {
    return this.put<{ message: string }>(`/redis/${connectionId}/key/${encodeURIComponent(key)}`, data)
  }

  /**
   * Delete key
   */
  async deleteKey(
    connectionId: string,
    key: string,
    db?: number
  ): Promise<ApiResponse<DeleteKeyResponseDto>> {
    const query = db === undefined ? '' : `?db=${db}`
    return this.delete<DeleteKeyResponseDto>(`/redis/${connectionId}/key/${encodeURIComponent(key)}${query}`)
  }

  /**
   * Get Redis databases
   */
  async getDatabases(connectionId: string): Promise<ApiResponse<ListDatabasesResponseDto>> {
    return this.get<ListDatabasesResponseDto>(`/redis/${connectionId}/databases`)
  }

  /**
   * Get Redis server info
   */
  async getInfo(connectionId: string): Promise<ApiResponse<RedisInfoResponseDto>> {
    return this.get<RedisInfoResponseDto>(`/redis/${connectionId}/info`)
  }

  /**
   * Get database info
   */
  async getDatabaseInfo(
    connectionId: string,
    database?: number
  ): Promise<ApiResponse<GetDatabaseInfoResponseDto>> {
    if (database === undefined) {
      return this.get<GetDatabaseInfoResponseDto>(`/redis/${connectionId}/database/0`)
    }

    return this.get<GetDatabaseInfoResponseDto>(`/redis/${connectionId}/database/${database}`)
  }

  /**
   * Switch database
   */
  async switchDatabase(
    connectionId: string,
    database: number
  ): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>(`/redis/${connectionId}/database/${database}/select`, { database })
  }

  /**
   * Flush database
   */
  async flushDatabase(
    connectionId: string,
    database: number,
    confirmation: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>(`/redis/${connectionId}/database/${database}/flush`, { confirmation })
  }

  /**
   * Rename key
   */
  async renameKey(
    connectionId: string,
    key: string,
    data: RenameKeyRequestDto
  ): Promise<ApiResponse<RenameKeyResponseDto>> {
    return this.post<RenameKeyResponseDto>(`/redis/${connectionId}/key/${encodeURIComponent(key)}/rename`, data)
  }

  /**
   * Set key TTL
   */
  async setTtl(
    connectionId: string,
    key: string,
    data: SetTtlRequestDto
  ): Promise<ApiResponse<SetTtlResponseDto>> {
    return this.post<SetTtlResponseDto>(`/redis/${connectionId}/key/${encodeURIComponent(key)}/ttl`, data)
  }
}
