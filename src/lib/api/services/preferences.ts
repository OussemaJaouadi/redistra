/**
 * User Preferences API service
 */

import { BaseApiClient } from '../client'
import type {
  ListUserPreferencesResponseDto,
  UpdateUserPreferenceRequestDto,
  UpdateUserPreferenceResponseDto,
  ApiResponse,
} from '@/types'

export class PreferencesApiService extends BaseApiClient {
  /**
   * Get user preferences
   */
  async getPreferences(): Promise<ApiResponse<ListUserPreferencesResponseDto>> {
    return this.get<ListUserPreferencesResponseDto>('/preferences')
  }

  /**
   * Update user preference
   */
  async updatePreference(
    key: string,
    data: UpdateUserPreferenceRequestDto
  ): Promise<ApiResponse<UpdateUserPreferenceResponseDto>> {
    return this.put<UpdateUserPreferenceResponseDto>(`/preferences/${key}`, data)
  }

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>('/preferences/reset')
  }

  /**
   * Get specific preference
   */
  async getPreference(key: string): Promise<ApiResponse<{ value: unknown }>> {
    return this.get<{ value: unknown }>(`/preferences/${key}`)
  }

  /**
   * Delete preference
   */
  async deletePreference(key: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete<{ message: string }>(`/preferences/${key}`)
  }
}
