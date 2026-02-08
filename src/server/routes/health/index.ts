import { Elysia } from 'elysia'
import os from 'node:os'
import { requireAuth } from '@/server/plugins/roles'
import type { SystemHealthResponseDto } from '@/types'

/**
 * System health routes (authenticated)
 */
export const healthRoutes = new Elysia({ prefix: '/health' })
  .use(requireAuth())
  .get('/', async (): Promise<SystemHealthResponseDto> => {
    const memoryUsage = process.memoryUsage()
    const cpuInfo = os.cpus()

    return {
      success: true,
      info: {
        os: {
          platform: os.platform(),
          release: os.release(),
          arch: os.arch(),
          hostname: os.hostname(),
        },
        cpu: {
          model: cpuInfo[0]?.model || 'Unknown',
          cores: cpuInfo.length,
          loadavg: os.loadavg() as [number, number, number],
        },
        memory: {
          rss: memoryUsage.rss,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
        },
        process: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          env: process.env.NODE_ENV || 'development',
        },
      },
    }
  })
