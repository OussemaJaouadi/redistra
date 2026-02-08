/**
 * Authentication API service
 */

import { BaseApiClient } from '../client'
import type {
  RegisterRequestDto,
  RegisterResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  LogoutResponseDto,
  MeResponseDto,
  RefreshResponseDto,
  ApiResponse,
} from '@/types'

export class AuthApiService extends BaseApiClient {
  /**
   * Register a new user (authenticated)
   */
  async register(data: RegisterRequestDto): Promise<ApiResponse<RegisterResponseDto>> {
    return this.post<RegisterResponseDto>('/auth/register', data)
  }

  /**
   * User login
   */
  async login(data: LoginRequestDto): Promise<ApiResponse<LoginResponseDto>> {
    return this.post<LoginResponseDto>('/auth/login', data)
  }

  /**
   * User logout
   */
  async logout(): Promise<ApiResponse<LogoutResponseDto>> {
    return this.post<LogoutResponseDto>('/auth/logout')
  }

  /**
   * Refresh access token
   */
  async refresh(): Promise<ApiResponse<RefreshResponseDto>> {
    return this.post<RefreshResponseDto>('/auth/refresh')
  }

  /**
   * Get current user info
   */
  async me(): Promise<ApiResponse<MeResponseDto>> {
    return this.get<MeResponseDto>('/auth/me')
  }
}
