# Supabase Database Setup Guide

This guide will help you set up your database tables in Supabase for the NestJS Chat Application.

## 🚀 Quick Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**

   - Navigate to [app.supabase.com](https://app.supabase.com)
   - Select your project or create a new one

2. **Open the SQL Editor**

   - Click on "SQL Editor" in the sidebar
   - Click "New query"

3. **Run the migration**

   - Copy the entire contents of `supabase_migration.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the migration

4. **Verify the setup**
   - Go to "Table editor" in the sidebar
   - You should see all tables: `users`, `interests`, `rooms`, `chats`, `user_interests`, `room_members`

### Option 2: Using Supabase CLI

1. **Install Supabase CLI** (if not already installed):

   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:

   ```bash
   supabase login
   ```

3. **Link to your project**:

   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

4. **Run the migration**:
   ```bash
   supabase db reset
   # Then copy the SQL content to a new migration file
   supabase migration new initial_setup
   # Paste the SQL content into the generated migration file
   supabase db push
   ```

## 📋 What Gets Created

The migration creates the following database structure:

### Tables

- **users** - User accounts and profiles
- **interests** - Available interests/hobbies
- **rooms** - Chat rooms (personal or group)
- **chats** - Chat messages (including AI responses)
- **user_interests** - Many-to-many: Users ↔ Interests
- **room_members** - Many-to-many: Rooms ↔ Users

### Enums

- **room_type** - ENUM('personal', 'group')

### Indexes

- Performance indexes on frequently queried columns
- Composite indexes for optimal query performance

### Security

- Row Level Security (RLS) policies for data protection
- Foreign key constraints for data integrity
- Unique constraints to prevent duplicates

### Views (Optional)

- **user_profiles** - Users with their interests aggregated
- **room_details** - Rooms with member information

## 🔧 Configuration

After running the migration, update your NestJS application's environment variables:

```env
# Database (from your Supabase project settings)
SUPABASE_DB_HOST=db.your-project-ref.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-database-password
SUPABASE_DB_NAME=postgres

# Supabase API (from your Supabase project settings)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT (can be found in Supabase project settings under API)
JWT_SECRET=your-jwt-secret

# AI Configuration
GROQ_API_KEY=your-groq-api-key
LANGSMITH_API_KEY=your-langsmith-api-key
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=nestjs-chat-ai
```

## 🧪 Testing the Setup

### 1. Verify Tables Creation

Run this query in Supabase SQL Editor to verify all tables were created:

```sql
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns
        WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 2. Check Sample Data

The migration includes some sample interests. Verify they were inserted:

```sql
SELECT * FROM interests ORDER BY name;
```

### 3. Test with Your Application

Start your NestJS application and test the basic functionality:

```bash
npm run start:dev
```

Try creating a user account and sending messages to verify the database integration works.

## 🔒 Security Considerations

The migration includes Row Level Security (RLS) policies. Key points:

1. **Authentication Required**: Most operations require authenticated users
2. **Room-based Access**: Users can only access rooms they're members of
3. **Own Data**: Users can only modify their own profile data
4. **Message Privacy**: Only room members can view messages

### Customizing RLS Policies

If you need to modify the security policies, you can update them in the Supabase dashboard:

1. Go to "Authentication" → "Policies"
2. Select the table you want to modify
3. Edit the existing policies or create new ones

## 🐛 Troubleshooting

### Common Issues

1. **UUID Extension Error**

   ```sql
   -- Run this if you get UUID extension errors
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **Permission Denied**

   - Make sure you're using the correct database credentials
   - Verify your user has sufficient permissions

3. **Foreign Key Constraint Errors**

   - The migration creates foreign key relationships
   - Make sure parent tables exist before child tables

4. **RLS Policy Issues**
   - If you're having trouble with permissions, you can temporarily disable RLS:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

### Rollback (if needed)

If you need to rollback the migration:

```sql
-- Drop all tables (WARNING: This will delete all data!)
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS room_members CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS interests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS room_type;

-- Drop views
DROP VIEW IF EXISTS user_profiles;
DROP VIEW IF EXISTS room_details;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();
```

## 📊 Database Schema Diagram

```
Users                    Interests
├─ id (UUID)            ├─ id (UUID)
├─ name                 ├─ name (unique)
├─ username (unique)    ├─ createdAt
├─ email (unique)       └─ updatedAt
├─ password                  ↑
├─ password_key             │
├─ about                    │ (Many-to-Many)
├─ birthday                 │
├─ height               User_Interests
├─ weight               ├─ user_id (FK)
├─ createdAt            └─ interest_id (FK)
└─ updatedAt

Rooms                   Room_Members
├─ id (UUID)           ├─ room_id (FK)
├─ name                └─ user_id (FK)
├─ type (enum)              ↑
├─ createdAt               │ (Many-to-Many)
└─ updatedAt               │
     ↑                     │
     │ (One-to-Many)       │
     │                     ↓
   Chats                 Users
   ├─ id (UUID)
   ├─ content
   ├─ isAiResponse
   ├─ sender_id (FK)
   ├─ room_id (FK)
   ├─ createdAt
   └─ updatedAt
```

## ✅ Next Steps

After successfully running the migration:

1. ✅ Verify all tables are created
2. ✅ Test basic CRUD operations
3. ✅ Set up your environment variables
4. ✅ Run your NestJS application
5. ✅ Test user registration and chat functionality
6. ✅ Configure AI integration with proper API keys

Your database is now ready for the AI-powered NestJS chat application! 🎉
