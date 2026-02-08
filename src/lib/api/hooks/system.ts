/**
 * System health hooks
 */

import { useQuery } from '@tanstack/react-query'
import { SystemApiService } from '../services/system'

const systemApi = new SystemApiService()

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => systemApi.getHealth(),
    staleTime: 10 * 1000,
  })
}
