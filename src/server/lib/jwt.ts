import { env } from '@/env'
import { jwt as jwtPlugin } from '@elysiajs/jwt'

/**
 * Create JWT instance for signing and verifying tokens
 */
export const createJWT = () => {
  return jwtPlugin({
    name: 'jwt',
    secret: env.JWT_SECRET,
  })
}


