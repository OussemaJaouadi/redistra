import { Elysia, t } from 'elysia'
import { requireRole } from '@/server/plugins/roles'
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from '@/server/controllers/users'
import { logAudit, getClientIP, getUserAgent } from '@/server/lib/audit'
import type {
  ListUsersQueryDto,
  ListUsersResponseDto,
  GetUserResponseDto,
  CreateUserResponseDto,
  UpdateUserResponseDto,
  DeleteUserResponseDto,
  ResetPasswordResponseDto,
} from '@/types'
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  listUsersQuerySchema,
} from '@/types'

/**
 * User management routes (admin only)
 */
export const usersRoutes = new Elysia({ prefix: '/users' })
  .use(requireRole('admin'))
  
  // List users with pagination and filtering
  .get('/', async ({ query, set }): Promise<ListUsersResponseDto> => {
    try {
      return await listUsers(query as ListUsersQueryDto)
    } catch (error) {
      console.error('List users error:', error)
      set.status = 500
      return {
        success: false,
        users: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
        error: 'Failed to list users',
      }
    }
  }, {
    query: listUsersQuerySchema,
  })

  // Get single user
  .get('/:id', async ({ params, set }): Promise<GetUserResponseDto> => {
    try {
      const result = await getUser(params.id)
      if (!result.success) {
        set.status = 404
      }
      return result
    } catch (error) {
      console.error('Get user error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to get user',
      }
    }
  }, {
    params: t.Object({ id: t.String() }),
  })

  // Create user
  .post('/', async ({ body, set, user, request }): Promise<CreateUserResponseDto> => {
    try {
      const result = await createUser(body)
      if (!result.success) {
        set.status = result.error?.includes('exists') ? 409 : 400
        return result
      }

      // Log user creation
      await logAudit({
        userId: user.id,
        action: 'user.created',
        resourceType: 'user',
        resourceId: result.user?.id,
        resourceName: body.username,
        details: JSON.stringify({
          createdBy: user.username,
          role: body.role
        }),
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })

      return result
    } catch (error) {
      console.error('Create user error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to create user',
      }
    }
  }, {
    body: createUserSchema,
  })

  // Update user
  .patch('/:id', async ({ params, body, user, set, request }): Promise<UpdateUserResponseDto> => {
    try {
      const result = await updateUser(params.id, body, user.id)
      if (!result.success) {
        set.status = result.error === 'User not found' ? 404 :
                     result.error?.includes('exists') ? 409 : 400
        return result
      }

      // Log user update
      await logAudit({
        userId: user.id,
        action: 'user.updated',
        resourceType: 'user',
        resourceId: params.id,
        resourceName: body.username || 'User',
        details: JSON.stringify({
          updatedBy: user.username,
          updatedFields: Object.keys(body)
        }),
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })

      return result
    } catch (error) {
      console.error('Update user error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to update user',
      }
    }
  }, {
    params: t.Object({ id: t.String() }),
    body: updateUserSchema,
  })

  // Delete user
  .delete('/:id', async ({ params, user, set, request }): Promise<DeleteUserResponseDto> => {
    try {
      const result = await deleteUser(params.id, user.id)
      if (!result.success) {
        set.status = result.error === 'User not found' ? 404 : 400
        return result
      }

      // Log user deletion
      await logAudit({
        userId: user.id,
        action: 'user.deleted',
        resourceType: 'user',
        resourceId: params.id,
        resourceName: 'User',
        details: JSON.stringify({
          deletedBy: user.username
        }),
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })

      return result
    } catch (error) {
      console.error('Delete user error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to delete user',
      }
    }
  }, {
    params: t.Object({ id: t.String() }),
  })

  // Reset user password
  .post('/:id/reset-password', async ({ params, body, user, set, request }): Promise<ResetPasswordResponseDto> => {
    try {
      const result = await resetUserPassword(params.id, body)
      if (!result.success) {
        set.status = result.error === 'User not found' ? 404 : 400
        return result
      }

      // Log password reset
      await logAudit({
        userId: user.id,
        action: 'user.password_reset',
        resourceType: 'user',
        resourceId: params.id,
        resourceName: 'User',
        details: JSON.stringify({
          resetBy: user.username
        }),
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })

      return result
    } catch (error) {
      console.error('Reset password error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to reset password',
      }
    }
  }, {
    params: t.Object({ id: t.String() }),
    body: resetPasswordSchema,
  })
