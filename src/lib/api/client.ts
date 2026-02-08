/**
 * Base API client configuration and utilities
 */

import type { ApiResponse } from '@/types'

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string | string[]
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Base API client with common functionality
 */
export class BaseApiClient {
  protected readonly baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  /**
   * Make HTTP request with proper error handling
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    allowRefresh: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for HTTP-only cookies
      cache: 'no-store', // Ensure we always get fresh data
      ...options,
    }

    try {
      const response = await fetch(url, config)
      let data: ApiResponse<T> | null = null
      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (response.status === 401 && allowRefresh && this.shouldAttemptRefresh(endpoint)) {
        const refreshed = await this.refreshAccessToken()
        if (refreshed) {
          return this.request<T>(endpoint, options, false)
        }

        // Only redirect if not on auth endpoints that can return 401
        if (!this.isAuthEndpoint(endpoint)) {
          this.handleAuthFailure()
        }
      }

      // Handle API-level errors
      if (!response.ok) {
        // Special handling for 423 (Locked) - brute force protection
        if (response.status === 423) {
          throw new ApiError(
            data?.error || 'Account temporarily locked due to too many failed attempts. Please try again later.',
            response.status,
            data?.details
          )
        }
        
        throw new ApiError(
          data?.error || 'Request failed',
          response.status,
          data?.details
        )
      }

      if (data && data.success === false) {
        throw new ApiError(
          data.error || 'Request failed',
          response.status,
          data.details
        )
      }

      return (data || { success: true }) as ApiResponse<T>
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      // Handle network errors, JSON parsing errors, etc.
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        undefined,
        undefined
      )
    }
  }

  /**
   * GET request
   */
  protected async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  /**
   * POST request
   */
  protected async post<T>(
    endpoint: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH request
   */
  protected async patch<T>(
    endpoint: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  protected async put<T>(
    endpoint: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  protected async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      return response.ok
    } catch {
      return false
    }
  }

  private shouldAttemptRefresh(endpoint: string): boolean {
    if (endpoint === '/auth/refresh') {
      return false
    }

    if (this.isAuthEndpoint(endpoint)) {
      return false
    }

    return true
  }

  private isAuthEndpoint(endpoint: string): boolean {
    return endpoint === '/auth/login' || endpoint === '/auth/setup' || endpoint === '/auth/me'
  }

  private handleAuthFailure() {
    if (typeof window === 'undefined') {
      return
    }

    const loginUrl = new URL('/login', window.location.origin)
    loginUrl.searchParams.set('from', window.location.pathname)
    window.location.assign(loginUrl.toString())
  }
}

/**
 * Create API client instance
 */
export const createApiClient = (baseUrl?: string) => new BaseApiClient(baseUrl)
