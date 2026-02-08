/**
 * Settings API service
 */

import { BaseApiClient } from '../client'
import type {
  ListSystemSettingsResponseDto,
  UpdateSystemSettingRequestDto,
  UpdateSystemSettingResponseDto,
  GetPublicSettingsResponseDto,
  ApiResponse,
} from '@/types'

export class SettingsApiService extends BaseApiClient {
  /**
   * Get system settings
   */
  async getSettings(): Promise<ApiResponse<ListSystemSettingsResponseDto>> {
    return this.get<ListSystemSettingsResponseDto>('/settings')
  }

  /**
   * Update system setting
   */
  async updateSetting(
    key: string,
    data: UpdateSystemSettingRequestDto
  ): Promise<ApiResponse<UpdateSystemSettingResponseDto>> {
    return this.put<UpdateSystemSettingResponseDto>(`/settings/${key}`, data)
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>('/settings/reset')
  }

  /**
   * Get public settings (no auth required)
   */
  async getPublicSettings(): Promise<ApiResponse<GetPublicSettingsResponseDto>> {
    return this.get<GetPublicSettingsResponseDto>('/public/settings')
  }
}
