# 4353-Group-Project

## Auth Database Schema

```sql
CREATE TABLE "UserCredentials" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'volunteer',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Encryption Flow

- Passwords are hashed with `bcrypt` (10-round salt) before they are written through Prisma to the `UserCredentials` table.
- During login the submitted password or username is resolved to the user record and verified against the stored hash. No plaintext passwords are stored or returned.
- Signed JSON Web Tokens encapsulate the `sub` (user id) and `role`. Tokens are signed with `JWT_SECRET`, expire according to `JWT_EXPIRES`, and are returned both in the body and as an `HttpOnly` cookie so axios picks them up automatically.
- Protected routes rely on middleware that validates the token, surfaces auth errors, and enforces role-based access control.

## Local Setup Notes

1. Add a `backend/.env` file and set:
   ```
   DATABASE_URL="file:./prisma/dev.db"
   JWT_SECRET="change-me"
   JWT_EXPIRES="1h"
   WEB_ORIGIN="http://localhost:5173"
   ```
2. Install dependencies inside `backend/`:
   ```bash
   npm install
   ```
3. Run the initial Prisma migrations (set the engine cache paths if your shell restricts home directory writes):
   ```bash
   CHECKPOINT_DISABLE=1 \
   PRISMA_SCHEMA_ENGINE_BINARY=./node_modules/@prisma/engines/schema-engine-darwin-arm64 \
   PRISMA_QUERY_ENGINE_LIBRARY=./node_modules/@prisma/engines/libquery_engine-darwin-arm64.dylib.node \
   PRISMA_CLI_ENGINE_BINARY_CACHE_DIR=./tmp/prisma \
   PRISMA_CLI_TMP_DIR=./tmp/prisma \
   npx prisma migrate dev --name init_auth_tables --schema=./prisma/schema.prisma

   CHECKPOINT_DISABLE=1 \
   PRISMA_SCHEMA_ENGINE_BINARY=./node_modules/@prisma/engines/schema-engine-darwin-arm64 \
   PRISMA_QUERY_ENGINE_LIBRARY=./node_modules/@prisma/engines/libquery_engine-darwin-arm64.dylib.node \
   PRISMA_CLI_ENGINE_BINARY_CACHE_DIR=./tmp/prisma \
   PRISMA_CLI_TMP_DIR=./tmp/prisma \
   npx prisma migrate dev --name add_username_to_user_credentials --schema=./prisma/schema.prisma

   CHECKPOINT_DISABLE=1 \
   PRISMA_SCHEMA_ENGINE_BINARY=./node_modules/@prisma/engines/schema-engine-darwin-arm64 \
   PRISMA_QUERY_ENGINE_LIBRARY=./node_modules/@prisma/engines/libquery_engine-darwin-arm64.dylib.node \
   PRISMA_CLI_ENGINE_BINARY_CACHE_DIR=./tmp/prisma \
   PRISMA_CLI_TMP_DIR=./tmp/prisma \
   npx prisma migrate dev --name add_event_details --schema=./prisma/schema.prisma
   ```
4. Start the API:
   ```bash
   npm run dev
   ```

The new Jest + Supertest suite for `/api/auth` lives in `backend/tests/auth.test.js`. It exercises registration, duplicate handling, username/email login failures, JWT-protected routes, and error branches; run it with:

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js tests/auth.test.js
```

Event CRUD and validation scenarios are covered in `backend/tests/events.test.js`:

```bash
node --experimental-vm-modules ./node_modules/jest/bin/jest.js tests/events.test.js
```
