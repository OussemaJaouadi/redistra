/**
 * Import/Export API service
 */

import { BaseApiClient } from '../client'
import type {
  ExportConnectionRequestDto,
  ExportConnectionResponseDto,
  ImportConnectionRequestDto,
  ImportConnectionResponseDto,
  ExportKeysRequestDto,
  ExportKeysResponseDto,
  ImportKeysRequestDto,
  ImportKeysResponseDto,
  ExportStatusResponseDto,
  ApiResponse,
} from '@/types'

export class ImportExportApiService extends BaseApiClient {
  /**
   * Export connection
   */
  async exportConnection(data: ExportConnectionRequestDto): Promise<ApiResponse<ExportConnectionResponseDto>> {
    return this.post<ExportConnectionResponseDto>('/import-export/connections/export', data)
  }

  /**
   * Export keys
   */
  async exportKeys(data: ExportKeysRequestDto): Promise<ApiResponse<ExportKeysResponseDto>> {
    return this.post<ExportKeysResponseDto>('/import-export/keys/export', data)
  }

  /**
   * Import connection
   */
  async importConnection(data: ImportConnectionRequestDto): Promise<ApiResponse<ImportConnectionResponseDto>> {
    return this.post<ImportConnectionResponseDto>('/import-export/connections/import', data)
  }

  /**
   * Import keys
   */
  async importKeys(data: ImportKeysRequestDto): Promise<ApiResponse<ImportKeysResponseDto>> {
    return this.post<ImportKeysResponseDto>('/import-export/keys/import', data)
  }

  /**
   * Get export status
   */
  async getExportStatus(exportId: string): Promise<ApiResponse<ExportStatusResponseDto>> {
    return this.get<ExportStatusResponseDto>(`/import-export/status/${exportId}`)
  }

  /**
   * Download exported file
   */
  async downloadExport(fileId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/import-export/download/${fileId}`, {
      credentials: 'include',
    })
    
    if (!response.ok) {
      throw new Error('Download failed')
    }
    
    return response.blob()
  }

  /**
   * Validate import file
   */
  async validateImport(file: File): Promise<ApiResponse<{
    isValid: boolean
    connections?: unknown[]
    errors?: string[]
    warnings?: string[]
  }>> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${this.baseUrl}/import-export/validate`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    return response.json()
  }
}
