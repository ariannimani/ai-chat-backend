# MongoDB to PostgreSQL Migration Guide

## Migration Summary

This application has been successfully migrated from MongoDB/Mongoose to PostgreSQL/Supabase using TypeORM.

## Changes Made

### 1. Dependencies Updated

- **Removed**: `@nestjs/mongoose`, `mongoose`, `mongoose-autopopulate`
- **Added**: `@nestjs/typeorm`, `typeorm`, `pg`, `@types/pg`

### 2. Database Entities Created

- ✅ `src/users/entities/user.entity.ts` - User entity with UUID primary key
- ✅ `src/interests/entities/interest.entity.ts` - Interest entity
- ✅ `src/rooms/entities/room.entity.ts` - Room entity with many-to-many user relationships
- ✅ `src/chats/entities/chat.entity.ts` - Chat entity with foreign keys to users and rooms

### 3. Services Updated

All services now use TypeORM repositories instead of Mongoose models:

- ✅ `src/users/users.service.ts` - Updated to use TypeORM Repository
- ✅ `src/interests/interests.service.ts` - Updated to use TypeORM Repository
- ✅ `src/rooms/rooms.service.ts` - Updated to use TypeORM Repository with proper relationship handling
- ✅ `src/chats/chats.service.ts` - Updated to use TypeORM Repository

### 4. Modules Updated

All modules now import TypeORM entities instead of Mongoose schemas:

- ✅ `src/users/users.module.ts`
- ✅ `src/interests/interests.module.ts`
- ✅ `src/rooms/rooms.module.ts` - Includes User repository for member management
- ✅ `src/chats/chats.module.ts`

### 5. App Module Updated

- ✅ `src/app.module.ts` - Now uses TypeORM configuration for PostgreSQL with SSL support for production

### 6. Controllers and Services Updated

- ✅ `src/users/users.controller.ts` - Updated to use `id` instead of `_id.toString()`
- ✅ `src/auth/auth.service.ts` - Updated to use `id` instead of `_id.toString()`
- ✅ `src/chats/chats.gateway.ts` - Updated to use `id` instead of `_id.toString()`

### 7. DTOs Updated

- ✅ `src/users/dto/update-user.dto.ts` - Updated interests to use `string[]` for UUID

### 8. Schema Cleanup

- ✅ Removed all old Mongoose schema files:
  - `src/users/schemas/user.schemas.ts`
  - `src/interests/schemas/interest.schema.ts`
  - `src/rooms/schemas/room.schemas.ts`
  - `src/chats/schemas/chat.schemas.ts`

## Required Environment Variables

Create a `.env` file with the following variables for Supabase PostgreSQL:

```env
# Database Configuration (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres

# Supabase Configuration (for @supabase/supabase-js and nestjs-supabase-auth)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=7d

# Node Environment
NODE_ENV=development

# Optional: Frontend URL for password reset redirects
FRONTEND_URL=http://localhost:3000
```

## Database Schema Changes

### Key Differences from MongoDB:

1. **Primary Keys**: Changed from MongoDB ObjectId to UUID
2. **Relationships**:
   - User-Interest: Many-to-many with `user_interests` join table
   - Room-User: Many-to-many with `room_members` join table
   - Chat-User: Many-to-one (sender relationship)
   - Chat-Room: Many-to-one
3. **Timestamps**: Using TypeORM's `@CreateDateColumn` and `@UpdateDateColumn`
4. **Enums**: Room type enum stored as PostgreSQL enum type
5. **Password Fields**: Now using `select: false` in TypeORM entity definition

### Database Tables That Will Be Created:

- `users` - User information with UUID primary key
- `interests` - Interest categories
- `rooms` - Chat rooms with type enum
- `chats` - Chat messages with foreign keys
- `user_interests` - Join table for user-interest many-to-many relationship
- `room_members` - Join table for room-user many-to-many relationship

## Installation & Setup

1. **Install new dependencies:**

   ```bash
   npm install
   ```

2. **Set up your Supabase PostgreSQL database**

   - Create a new project in Supabase
   - Get your database connection details from the project settings

3. **Configure environment variables**

   - Create `.env` file with the variables shown above
   - Update with your actual Supabase credentials

4. **Run the application:**

   ```bash
   npm run start:dev
   ```

5. **Database tables will be automatically created** due to `synchronize: true` in development mode

## Data Migration

If you have existing MongoDB data, you'll need to:

1. Export data from MongoDB
2. Transform the data format:
   - Convert ObjectId to UUID
   - Update relationship structure for join tables
   - Ensure timestamp format compatibility
3. Import into PostgreSQL

## Seeding Data

The seeding command for interests should work as before:

```bash
npm run seed:app
```

## API Changes

### No Breaking Changes to REST API

- All existing REST endpoints remain the same
- Response formats are identical
- Authentication flow unchanged

### WebSocket Changes

- WebSocket functionality preserved
- User IDs now UUIDs instead of ObjectIds
- All other WebSocket behavior remains the same

## Production Considerations

- Database synchronization is disabled in production (`synchronize: false`)
- SSL is enabled for production database connections
- Consider creating proper database migrations for production deployments
- Ensure your Supabase instance is configured for production use

## Testing

After migration:

1. Test user registration and login
2. Test chat room creation and messaging
3. Test interest selection and user updates
4. Verify WebSocket connections work correctly
5. Test the interest seeding command

## New Supabase Integration Features ✨

In addition to the database migration, we've integrated the `@supabase/supabase-js` client library to unlock additional Supabase features:

### 1. Supabase Service (`src/config/supabase/supabase.service.ts`)

- Global Supabase client management
- Helper methods for auth, storage, real-time, and database operations
- Proper error handling and logging

### 2. Enhanced Chat Service with Real-time

- **Real-time chat broadcasting**: Messages are broadcast via Supabase channels
- **Room subscriptions**: Subscribe to chat room updates in real-time
- **Hybrid approach**: TypeORM for complex queries + Supabase for real-time features

### 3. File Upload Support (`src/chats/chats.controller.ts`)

- **File uploads**: Upload files to Supabase Storage buckets
- **File management**: List and manage uploaded files per chat room
- **Public URLs**: Generate public URLs for uploaded files

### 4. Supabase Authentication Integration

#### A. Supabase Auth Service (`src/auth/supabase-auth.service.ts`)

- **Supabase Authentication**: Alternative auth system alongside existing JWT
- **Password reset**: Built-in password reset functionality
- **Session management**: Handle user sessions with Supabase Auth
- **User management**: Sign up, sign in, and user profile updates

#### B. Supabase Passport Strategy (`src/auth/strategies/supabase.strategy.ts`)

- **Passport Integration**: Uses `nestjs-supabase-auth` library for Passport strategy
- **JWT Token Validation**: Validates Supabase JWT tokens automatically
- **Guard Integration**: Works with NestJS guard system for route protection

#### C. Supabase Auth Guard (`src/config/guard/supabase-auth.guard.ts`)

- **Route Protection**: Protect routes with Supabase authentication
- **Token Extraction**: Automatically extracts and validates Supabase JWT tokens

### Available Endpoints

#### Auth Endpoints

- `POST /auth/login` - Login with JWT auth
- `POST /auth/register` - Register with JWT auth
- `GET /auth/me` - Get current user (JWT auth)
- `GET /auth/supabase/me` - Get current user (Supabase auth) ✨ _New_

#### Chat Endpoints

- `GET /chats/:roomId` - Get chat history
- `POST /chats/:roomId/upload` - Upload files to chat room
- `GET /chats/:roomId/files` - List files in chat room

### Usage Examples

#### Real-time Chat Subscription (Frontend)

```javascript
// Subscribe to room updates
const supabase = createClient(SUPABASE_URL, SUPABASE_ANNON_KEY);

const channel = supabase
  .channel(`room:${roomId}`)
  .on('broadcast', { event: 'new_message' }, (payload) => {
    console.log('New message:', payload);
    // Update UI with new message
  })
  .subscribe();

// Cleanup when component unmounts
channel.unsubscribe();
```

#### File Upload Example

```javascript
// Upload file to chat room
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch(`/api/chats/${roomId}/upload`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### Supabase Storage Setup

To enable file uploads, create a storage bucket in your Supabase dashboard:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `chat-uploads`
3. Set appropriate policies for file access
4. Update RLS policies if needed

### Benefits of This Integration

1. **Real-time Features**: Instant message broadcasting and room subscriptions
2. **File Storage**: Built-in file upload and management capabilities
3. **Scalable Storage**: Leverage Supabase's CDN for file delivery
4. **Flexible Auth**: Choose between JWT or Supabase Auth based on your needs
5. **Hybrid Architecture**: Best of both worlds - TypeORM for complex queries, Supabase for real-time

The migration is complete and ready for use! 🚀
