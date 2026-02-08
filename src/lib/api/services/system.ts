/**
 * System health API service
 */

import { BaseApiClient } from '../client'
import type { SystemHealthResponseDto, ApiResponse } from '@/types'

export class SystemApiService extends BaseApiClient {
  /**
   * Get system health information
   */
  async getHealth(): Promise<ApiResponse<SystemHealthResponseDto>> {
    return this.get<SystemHealthResponseDto>('/health')
  }
}
