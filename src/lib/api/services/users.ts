/**
 * Users API service
 */

import { BaseApiClient } from '../client'
import type {
  CreateUserRequestDto,
  CreateUserResponseDto,
  UpdateUserRequestDto,
  UpdateUserResponseDto,
  DeleteUserResponseDto,
  ListUsersResponseDto,
  GetUserResponseDto,
  ApiResponse,
  ToggleUserStatusResponseDto,
} from '@/types'

export class UsersApiService extends BaseApiClient {
  /**
   * Get all users with pagination
   */
  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    isActive?: boolean
  }): Promise<ApiResponse<ListUsersResponseDto>> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.role) searchParams.append('role', params.role)
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString())

    const query = searchParams.toString()
    return this.get<ListUsersResponseDto>(`/users${query ? `?${query}` : ''}`)
  }

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<ApiResponse<GetUserResponseDto>> {
    return this.get<GetUserResponseDto>(`/users/${id}`)
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserRequestDto): Promise<ApiResponse<CreateUserResponseDto>> {
    return this.post<CreateUserResponseDto>('/users', data)
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    data: UpdateUserRequestDto
  ): Promise<ApiResponse<UpdateUserResponseDto>> {
    return this.patch<UpdateUserResponseDto>(`/users/${id}`, data)
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<ApiResponse<DeleteUserResponseDto>> {
    return this.delete<DeleteUserResponseDto>(`/users/${id}`)
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(id: string): Promise<ApiResponse<ToggleUserStatusResponseDto>> {
    return this.patch<ToggleUserStatusResponseDto>(`/users/${id}/toggle-status`)
  }

  /**
   * Reset user password
   */
  async resetPassword(id: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.patch<{ message: string }>(`/users/${id}/reset-password`, { newPassword })
  }
}
