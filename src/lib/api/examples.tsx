/**
 * API Client Usage Examples
 * 
 * This file demonstrates how to use the modular API client architecture
 * in React components throughout the application.
 */

import React from 'react'
import {
  // Hooks
  useLogin,
  useLogout,
  useMe,
  useUsers,
  useCreateUser,
  useConnections,
  useCreateConnection,
  useRedisKeys,
  useCreateRedisKey,
  useAuditLogs,
  useAuditStats,
  useSettings,
} from '@/lib/api'
import type {
  LoginRequestDto,
  CreateUserRequestDto,
  CreateConnectionRequestDto,
  CreateKeyRequestDto,
  Connection,
} from '@/types'

const DEFAULT_AUDIT_START = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

// Example: Authentication Component
export function AuthExample() {
  const loginMutation = useLogin()
  const logoutMutation = useLogout()
  const { data: user, isLoading } = useMe()

  const handleLogin = (credentials: LoginRequestDto) => {
    loginMutation.mutate(credentials, {
      onSuccess: () => {
        console.log('Login successful')
      },
      onError: (error) => {
        console.error('Login failed:', error)
      },
    })
  }

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {user?.data?.user ? (
        <div>
          <p>Welcome, {user.data.user.username}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => handleLogin({ username: 'admin', password: 'password' })}>
          Login
        </button>
      )}
    </div>
  )
}

// Example: User Management Component
export function UserManagementExample() {
  const { data: users, isLoading } = useUsers({ page: 1, limit: 10 })
  const createUserMutation = useCreateUser()

  const handleCreateUser = (userData: CreateUserRequestDto) => {
    createUserMutation.mutate(userData, {
      onSuccess: () => {
        console.log('User created successfully')
      },
    })
  }

  if (isLoading) return <div>Loading users...</div>

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users?.data?.users?.map(user => (
          <li key={user.id}>{user.username} ({user.role})</li>
        ))}
      </ul>
      <button onClick={() => handleCreateUser({
        username: 'newuser',
        password: 'password123',
        role: 'editor',
        isActive: true
      })}>
        Create User
      </button>
    </div>
  )
}

// Example: Connection Management Component
export function ConnectionManagementExample() {
  const { data: connections, isLoading } = useConnections()
  const createConnectionMutation = useCreateConnection()

  const handleCreateConnection = (connectionData: CreateConnectionRequestDto) => {
    createConnectionMutation.mutate(connectionData, {
      onSuccess: () => {
        console.log('Connection created successfully')
      },
    })
  }

  if (isLoading) return <div>Loading connections...</div>

  const myConnections = connections?.data?.connections?.my ?? []
  const sharedConnections = connections?.data?.connections?.shared ?? []

  return (
    <div>
      <h2>Redis Connections</h2>
      <ul>
        {myConnections.map((conn: Connection) => (
          <li key={conn.id}>{conn.name} - {conn.host}:{conn.port}</li>
        ))}
        {sharedConnections.map((conn: Connection) => (
          <li key={conn.id}>{conn.name} - {conn.host}:{conn.port} (Shared)</li>
        ))}
      </ul>
      <button onClick={() => handleCreateConnection({
        name: 'Local Redis',
        host: 'localhost',
        port: 6379,
        password: '',
        database: 0,
        useTls: false
      })}>
        Add Connection
      </button>
    </div>
  )
}

// Example: Redis Key Browser Component
export function RedisKeyBrowserExample({ connectionId }: { connectionId: string }) {
  const { data: keys, isLoading } = useRedisKeys(connectionId, { page: 1, limit: 25 })
  const createKeyMutation = useCreateRedisKey(connectionId)

  const handleCreateKey = (keyData: CreateKeyRequestDto) => {
    createKeyMutation.mutate(keyData, {
      onSuccess: () => {
        console.log('Key created successfully')
      },
    })
  }

  if (isLoading) return <div>Loading keys...</div>

  return (
    <div>
      <h2>Redis Keys</h2>
      <ul>
        {keys?.data?.keys?.map(key => (
          <li key={key.key}>
            {key.key} ({key.type}) {key.ttl && `TTL: ${key.ttl}s`}
          </li>
        ))}
      </ul>
      <button onClick={() => handleCreateKey({
        key: 'example:key',
        type: 'string',
        value: 'Hello, Redis!',
        ttl: 3600
      })}>
        Create Key
      </button>
    </div>
  )
}

// Example: Audit Logs Component
export function AuditLogsExample() {
  const { data: logs, isLoading } = useAuditLogs({ 
    page: 1, 
    limit: 20,
    startDate: DEFAULT_AUDIT_START, // Last 7 days
  })

  if (isLoading) return <div>Loading audit logs...</div>

  return (
    <div>
      <h2>Audit Logs</h2>
      <ul>
        {logs?.data?.logs?.map(log => (
          <li key={log.id}>
            {new Date(log.timestamp).toLocaleString()} - {log.action} by {log.userId} on {log.resourceType}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Example: Settings Component
export function SettingsExample() {
  const { data: settings, isLoading } = useSettings()

  if (isLoading) return <div>Loading settings...</div>

  return (
    <div>
      <h2>System Settings</h2>
      <pre>{JSON.stringify(settings?.data?.settings, null, 2)}</pre>
    </div>
  )
}

// Example: Custom Hook with Multiple API Calls
export function useDashboardData() {
  const { data: user } = useMe()
  const { data: connections } = useConnections()
  const { data: auditStats } = useAuditStats()

  return {
    user: user?.data?.user,
    connections: connections?.data?.connections,
    auditStats: auditStats?.data,
    isLoading: !user || !connections || !auditStats,
  }
}

// Example: Dashboard Component using custom hook
export function DashboardExample() {
  const { user, connections, auditStats, isLoading } = useDashboardData()

  if (isLoading) return <div>Loading dashboard...</div>

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.username}</p>
      <p>Total Connections: {(connections?.my?.length || 0) + (connections?.shared?.length || 0)}</p>
      <p>Total Audit Logs: {auditStats?.totalLogs}</p>
    </div>
  )
}
