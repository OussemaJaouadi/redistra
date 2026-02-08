# ⚠️ This is NOT a standalone server

**Elysia route definitions only** - these are imported into `src/app/api/[[...slugs]]/route.ts`

## Directory Structure

```
src/server/
├── lib/            # Pure utilities (no business logic)
│   ├── encryption.ts              # AES-256-GCM helpers
│   ├── connection-string-parser.ts # Redis URL parser
│   ├── redis-pool.ts              # Connection pooling
│   ├── password.ts                # Password hashing
│   └── jwt.ts                     # JWT plugin factory
├── controllers/    # Business logic (pure functions)
│   ├── auth.ts                    # Auth operations
│   ├── connections.ts             # Connection CRUD
│   └── users.ts                   # User management
├── routes/         # HTTP handlers (thin, use controllers)
│   ├── auth/                      # Setup, login, logout, me
│   ├── connections/               # Connection CRUD + test
│   └── users/                     # User CRUD (admin only)
├── plugins/        # Elysia middleware
│   ├── auth.ts                    # JWT verification + session
│   └── roles.ts                   # requireAuth, requireRole helpers
└── README.md       ← You are here
```

## Architecture Pattern

### Controllers (Business Logic)
**Pure functions** that handle business logic and return typed DTOs:

```typescript
// src/server/controllers/auth.ts
export async function login(
  data: LoginRequestDto,
  ipAddress: string
): Promise<LoginResultDto> {
  // Business logic only - no HTTP concerns
  return { success: true, user, sessionId, expiresAt }
}
```

### Routes (HTTP Handlers)
**Thin wrappers** that handle HTTP layer and call controllers:

```typescript
// src/server/routes/auth/login.ts
export const loginRoutes = new Elysia()
  .use(jwt({ name: 'jwt', secret: env.JWT_SECRET }))
  .post('/login', async ({ body, request, jwt, set }) => {
    // 1. Extract HTTP data
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
    
    // 2. Call controller
    const result = await loginController(body, ipAddress)
    
    // 3. Handle HTTP response
    if (!result.success) {
      set.status = 401
      return { success: false, error: result.error }
    }
    
    // 4. Generate JWT (route responsibility)
    const token = await jwt.sign({ sub: result.user.id, ... })
    set.headers['Set-Cookie'] = `token=${token}; HttpOnly; ...`
    
    return { success: true, user: result.user }
  })
```

## How It Works

1. Routes, controllers, and plugins are defined here
2. All routes are imported into `src/app/api/[[...slugs]]/route.ts`
3. The Elysia app is mounted inside Next.js App Router
4. **All API calls go through `localhost:3000/api/*`** (single port)

## ❌ DO NOT

- Run `bun run src/server/index.ts`
- Try to start a separate backend server
- Run Elysia on a different port
- Create custom JWT sign/verify functions (use `@elysiajs/jwt` plugin)
- Put business logic in routes (use controllers)
- Mix utilities with business logic (lib/ vs controllers/)

## ✅ DO

- Add utilities in `src/server/lib/` (pure functions, no business logic)
- Add business logic in `src/server/controllers/` (pure functions returning DTOs)
- Add HTTP handlers in `src/server/routes/` (thin wrappers calling controllers)
- Add middleware in `src/server/plugins/` (auth, roles, etc.)
- Use `@elysiajs/jwt` plugin for JWT signing in routes
- Use `requireAuth()`, `requireRole()` plugins for route protection
- Import and use them in `src/app/api/[[...slugs]]/route.ts`
- Define all types in `src/types/` for frontend/backend sharing
