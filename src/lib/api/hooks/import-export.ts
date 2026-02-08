/**
 * Import/Export React hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImportExportApiService } from '../services/import-export'
import type {
  ExportConnectionRequestDto,
  ExportKeysRequestDto,
  ImportConnectionRequestDto,
  ImportKeysRequestDto,
} from '@/types'

const importExportApi = new ImportExportApiService()

/**
 * Hook for exporting connection
 */
export function useExportConnection() {
  return useMutation({
    mutationFn: (data: ExportConnectionRequestDto) => importExportApi.exportConnection(data),
  })
}

/**
 * Hook for exporting keys
 */
export function useExportKeys() {
  return useMutation({
    mutationFn: (data: ExportKeysRequestDto) => importExportApi.exportKeys(data),
  })
}

/**
 * Hook for importing connection
 */
export function useImportConnection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ImportConnectionRequestDto) => importExportApi.importConnection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
  })
}

/**
 * Hook for importing keys
 */
export function useImportKeys(connectionId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ImportKeysRequestDto) => importExportApi.importKeys(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redis', connectionId, 'keys'] })
    },
  })
}

/**
 * Hook for getting export status
 */
export function useExportStatus(exportId: string) {
  return useQuery({
    queryKey: ['export', 'status', exportId],
    queryFn: () => importExportApi.getExportStatus(exportId),
    enabled: !!exportId,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 2000, // Poll every 2 seconds
  })
}

/**
 * Hook for downloading export
 */
export function useDownloadExport() {
  return useMutation({
    mutationFn: (fileId: string) => importExportApi.downloadExport(fileId),
  })
}

/**
 * Hook for validating import file
 */
export function useValidateImport() {
  return useMutation({
    mutationFn: (file: File) => importExportApi.validateImport(file),
  })
}
