/**
 * System health DTOs
 */

export type SystemHealthResponseDto = {
  success: boolean
  info?: {
    os: {
      platform: string
      release: string
      arch: string
      hostname: string
    }
    cpu: {
      model: string
      cores: number
      loadavg: [number, number, number]
    }
    memory: {
      rss: number
      heapUsed: number
      heapTotal: number
      external: number
    }
    process: {
      uptimeSeconds: number
      nodeVersion: string
      env: string
    }
  }
  error?: string
}
