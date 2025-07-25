-- ==================================================
-- NestJS Chat App - Complete Database Migration
-- ==================================================
-- This migration creates all tables and relationships for the chat application
-- Run this in your Supabase SQL Editor or via CLI

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM for room types
CREATE TYPE room_type AS ENUM ('personal', 'group');

-- ==================================================
-- 1. USERS TABLE
-- ==================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    password_key TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users("createdAt");

-- ==================================================
-- 2. ROOMS TABLE
-- ==================================================
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    type room_type DEFAULT 'personal',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for rooms table
CREATE INDEX idx_rooms_type ON rooms(type);
CREATE INDEX idx_rooms_created_at ON rooms("createdAt");

-- ==================================================
-- 3. CHATS TABLE
-- ==================================================
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    "isAiResponse" BOOLEAN DEFAULT FALSE,
    sender_id UUID NOT NULL,
    room_id UUID NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_chats_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_chats_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Indexes for chats table
CREATE INDEX idx_chats_sender_id ON chats(sender_id);
CREATE INDEX idx_chats_room_id ON chats(room_id);
CREATE INDEX idx_chats_created_at ON chats("createdAt");
CREATE INDEX idx_chats_room_created ON chats(room_id, "createdAt");
CREATE INDEX idx_chats_ai_response ON chats("isAiResponse");

-- ==================================================
-- 4. ROOM_MEMBERS JUNCTION TABLE (Many-to-Many)
-- ==================================================
CREATE TABLE room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_room_members_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_room_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate memberships
    CONSTRAINT uk_room_members UNIQUE (room_id, user_id)
);

-- Indexes for room_members table
CREATE INDEX idx_room_members_room_id ON room_members(room_id);
CREATE INDEX idx_room_members_user_id ON room_members(user_id);

-- ==================================================
-- 5. UPDATE TRIGGERS FOR TIMESTAMPS
-- ==================================================

-- Function to update the updatedAt column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updatedAt columns
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON rooms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at 
    BEFORE UPDATE ON chats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 8. ROW LEVEL SECURITY (RLS) - Optional but Recommended
-- ==================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (you can customize these based on your needs)

-- Users can read their own data and other users' public data
CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (true);

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

-- Users can insert their own data during registration
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Room members can view room details
CREATE POLICY "Room members can view rooms" ON rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM room_members 
            WHERE room_id = id AND user_id::text = auth.uid()::text
        )
    );

-- Room members can view room messages
CREATE POLICY "Room members can view messages" ON chats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM room_members 
            WHERE room_id = chats.room_id AND user_id::text = auth.uid()::text
        )
    );

-- Users can send messages to rooms they belong to
CREATE POLICY "Users can send messages to their rooms" ON chats
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM room_members 
            WHERE room_id = chats.room_id AND user_id::text = auth.uid()::text
        )
        AND sender_id::text = auth.uid()::text
    );



-- Allow reading room_members for room participants
CREATE POLICY "Room members can view membership" ON room_members
    FOR SELECT USING (
        user_id::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM room_members rm2 
            WHERE rm2.room_id = room_members.room_id AND rm2.user_id::text = auth.uid()::text
        )
    );

-- ==================================================
-- 9. SAMPLE DATA (Optional - for testing)
-- ==================================================



-- ==================================================
-- 10. USEFUL VIEWS (Optional)
-- ==================================================

-- View for user profiles
CREATE VIEW user_profiles AS
SELECT 
    u.id,
    u.name,
    u.username,
    u.email,
    u."createdAt",
    u."updatedAt"
FROM users u;

-- View for room details with member count
CREATE VIEW room_details AS
SELECT 
    r.id,
    r.name,
    r.type,
    r."createdAt",
    r."updatedAt",
    COUNT(rm.user_id) as member_count,
    COALESCE(
        json_agg(
            json_build_object(
                'id', u.id, 
                'name', u.name, 
                'username', u.username
            )
        ) FILTER (WHERE u.id IS NOT NULL),
        '[]'::json
    ) AS members
FROM rooms r
LEFT JOIN room_members rm ON r.id = rm.room_id
LEFT JOIN users u ON rm.user_id = u.id
GROUP BY r.id, r.name, r.type, r."createdAt", r."updatedAt";

-- ==================================================
-- MIGRATION COMPLETE!
-- ==================================================

-- Verify the migration by checking table counts
SELECT 
    'Migration completed successfully!' as status,
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created;

-- List all created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name; 