# NestJS Chat App - AI Integration with LangChain & Groq

This document describes the AI-powered chat functionality that has been integrated into your NestJS chat application using LangChain, Groq, and LangSmith.

## 🚀 Features

- **AI-Powered Responses**: Each user message triggers an AI response using Groq's fast LLM
- **Per-Room Memory**: Each chat room maintains its own conversation context using LangChain BufferMemory
- **Real-time Broadcasting**: AI responses are automatically broadcast to all users in the same room via WebSocket
- **User Context Awareness**: AI knows who the user is, which room they're in, and the conversation history
- **LangSmith Tracing**: Full observability and debugging with LangSmith integration

## 📦 New Dependencies Added

The following packages have been added to your `package.json`:

```json
{
  "langchain": "^0.3.2",
  "langsmith": "^0.2.3",
  "@langchain/groq": "^0.1.2"
}
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# AI Configuration (LangChain + Groq)
GROQ_API_KEY=your_groq_api_key_here
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=nestjs-chat-ai
```

**Getting API Keys:**

- **Groq API Key**:

  1. Visit [Groq Console](https://console.groq.com/)
  2. Sign up/Login
  3. Generate an API key from the dashboard

- **LangSmith API Key** (optional but recommended for debugging):
  1. Visit [LangSmith](https://smith.langchain.com/)
  2. Sign up/Login
  3. Generate an API key from settings

### 3. Database Migration

The Chat entity has been updated with a new field. Run migrations if you're using them:

```sql
-- Add the isAiResponse column to the chats table
ALTER TABLE chats ADD COLUMN "isAiResponse" boolean DEFAULT false;
```

## 🏗 Architecture Overview

### New Components Added

#### 1. AI Service (`src/ai/ai.service.ts`)

- Manages Groq LLM integration
- Handles per-room memory using LangChain BufferMemory
- Generates context-aware AI responses
- Integrates with LangSmith for tracing

#### 2. AI Module (`src/ai/ai.module.ts`)

- Exports the AI service for use in other modules
- Configures dependencies

#### 3. Updated Chat Entity

- Added `isAiResponse: boolean` field to distinguish AI messages from user messages

#### 4. Enhanced Chat Service

- Integrated AI service to generate responses
- Added `generateAiResponse()` method
- Automatically triggers AI responses after user messages

#### 5. Enhanced WebSocket Gateway

- Added room management (join/leave room functionality)
- Broadcasts AI responses to all room members
- Improved error handling and logging

## 🔄 How It Works

### Message Flow

1. **User sends message** → WebSocket receives message
2. **User message saved** → Stored in database with `isAiResponse: false`
3. **User message broadcast** → Sent to all room members via WebSocket
4. **AI processing triggered** → AI service generates response based on:
   - User context (ID, username)
   - Room context (room ID)
   - Conversation history (from BufferMemory)
5. **AI response saved** → Stored in database with `isAiResponse: true`
6. **AI response broadcast** → Sent to all room members via WebSocket

### Memory Management

- Each room has its own `BufferMemory` instance
- Conversation history is maintained per room
- Memory is automatically managed by LangChain

### LLM Configuration

The AI service uses:

- **Model**: `llama3-70b-8192` (fast Groq model optimized for chat)
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Max Tokens**: 1000 (reasonable response length)

## 🎯 Usage

### Frontend Integration

Your frontend should handle the new message types:

```javascript
// Join a room
socket.emit('join-room', { roomId: 'room-uuid' });

// Listen for new messages
socket.on('new-chat', (message) => {
  if (message.messageType === 'user') {
    // Handle user message
    console.log('User message:', message);
  } else if (message.messageType === 'ai') {
    // Handle AI response
    console.log('AI response:', message);
  }
});

// Send a message
socket.emit('create', {
  content: 'Hello, AI!',
  room_id: 'room-uuid',
});
```

### REST API

The existing REST endpoints continue to work:

```bash
# Get chat history for a room
GET /chats/:roomId?limit=50&last_id=optional

# Response includes both user and AI messages
# AI messages have isAiResponse: true
```

## 🛠 Customization

### Prompt Customization

Edit the prompt template in `src/ai/ai.service.ts`:

```typescript
const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant in a chat room. You should be friendly, engaging, and helpful.

Current context:
- Room ID: {roomId}
- User: {username} (ID: {userId})
- Message: {input}

Chat History:
{chat_history}

Please respond naturally to the user's message. Be concise but helpful, and maintain the conversation flow.

Response:`);
```

### Model Configuration

Change the LLM configuration in `src/ai/ai.service.ts`:

```typescript
this.llm = new ChatGroq({
  model: 'mixtral-8x7b-32768', // Alternative fast model
  apiKey: this.configService.get<string>('GROQ_API_KEY'),
  temperature: 0.5, // More conservative responses
  maxTokens: 500, // Shorter responses
});
```

### Memory Management

Add memory cleanup for inactive rooms:

```typescript
// In ai.service.ts
clearInactiveRoomMemories(inactiveRoomIds: string[]) {
  inactiveRoomIds.forEach(roomId => {
    this.roomMemories.delete(roomId);
  });
}
```

## 🐛 Troubleshooting

### Common Issues

1. **AI responses not generating**

   - Check Groq API key is set correctly
   - Verify network connectivity to Groq API
   - Check logs for AI service errors

2. **Messages not broadcasting to room members**

   - Ensure clients are joining rooms with `join-room` event
   - Check WebSocket connection status
   - Verify room IDs match between client and server

3. **Memory issues with many rooms**
   - Implement periodic memory cleanup
   - Monitor memory usage
   - Consider using Redis for persistent memory storage

### Debug Mode

Enable detailed logging by setting log level to debug in your main.ts:

```typescript
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // ...
  const logger = new Logger('Bootstrap');
  logger.log('AI-powered chat system starting...');
  // ...
}
```

## 📊 Monitoring with LangSmith

LangSmith provides detailed tracing of your AI interactions:

1. Visit [LangSmith Dashboard](https://smith.langchain.com/)
2. Select your project: `nestjs-chat-ai`
3. Monitor:
   - AI response times
   - Token usage
   - Error rates
   - Conversation flows

## 🚀 Deployment Considerations

### Production Checklist

- [ ] Set production Groq API key
- [ ] Configure LangSmith project for production
- [ ] Set up monitoring and alerting
- [ ] Implement rate limiting for AI requests
- [ ] Add AI response caching if needed
- [ ] Monitor token usage and costs
- [ ] Set up database indexes for chat queries

### Scaling

For high-traffic scenarios:

1. **Redis for Memory**: Store conversation memory in Redis
2. **Queue System**: Use Bull/Redis for AI processing queue
3. **Rate Limiting**: Implement user-based rate limiting
4. **Caching**: Cache common AI responses
5. **Load Balancing**: Distribute AI processing across multiple instances

## 📝 API Reference

### Environment Variables

| Variable            | Description                   | Required | Example          |
| ------------------- | ----------------------------- | -------- | ---------------- |
| `GROQ_API_KEY`      | API key for Groq LLM service  | Yes      | `gsk_...`        |
| `LANGSMITH_API_KEY` | API key for LangSmith tracing | No       | `ls__...`        |
| `LANGSMITH_TRACING` | Enable LangSmith tracing      | No       | `true`           |
| `LANGSMITH_PROJECT` | LangSmith project name        | No       | `nestjs-chat-ai` |

### WebSocket Events

| Event        | Direction       | Data                                     | Description           |
| ------------ | --------------- | ---------------------------------------- | --------------------- |
| `join-room`  | Client → Server | `{ roomId: string }`                     | Join a chat room      |
| `leave-room` | Client → Server | `{ roomId: string }`                     | Leave a chat room     |
| `create`     | Client → Server | `CreateChatDto`                          | Send a message        |
| `new-chat`   | Server → Client | `Chat & { messageType: 'user' \| 'ai' }` | New message broadcast |
| `chat-error` | Server → Client | `{ message: string, error: string }`     | Error occurred        |

---

🎉 **Your NestJS chat app is now powered by AI!** Users can have natural conversations with an AI assistant that remembers the context and responds intelligently to their messages.

## 📄 **Files Created**

### 1. `supabase_migration.sql`

A complete SQL migration that creates all your database tables:

- **Core Tables**: `users`, `interests`, `rooms`, `chats`
- **Junction Tables**: `user_interests`, `room_members` (for many-to-many relationships)
- **Enums**: `room_type` (personal/group)
- **Indexes**: Performance optimized indexes on key columns
- **Security**: Row Level Security (RLS) policies for data protection
- **Triggers**: Auto-update `updatedAt` timestamps
- **Sample Data**: 10 default interests for testing
- **Views**: Helpful views for user profiles and room details

### 2. `SUPABASE_SETUP.md`

A detailed guide on how to run the migration and configure your database.

## 🚀 **Quick Setup Steps**

### **Step 1: Run the Migration**

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **"SQL Editor"** in the sidebar
4. Click **"New query"**
5. Copy the entire contents of `supabase_migration.sql`
6. Paste into the editor and click **"Run"**

### **Step 2: Verify Tables Created**

After running the migration, you should see these tables in your **Table Editor**:

✅ `users` - User accounts and profiles  
✅ `interests` - Available interests/hobbies  
✅ `rooms` - Chat rooms (personal or group)  
✅ `chats` - Chat messages (including AI responses)  
✅ `user_interests` - Users ↔ Interests relationship  
✅ `room_members` - Rooms ↔ Users relationship

### **Step 3: Update Environment Variables**

Get your database connection details from Supabase **Project Settings → Database**:

```env
# Database Connection
SUPABASE_DB_HOST=db.your-project-ref.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-database-password
SUPABASE_DB_NAME=postgres

# Supabase API (from Project Settings → API)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-jwt-secret

# AI Configuration
GROQ_API_KEY=your-groq-api-key
LANGSMITH_API_KEY=your-langsmith-api-key
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=nestjs-chat-ai
```

## 🔧 **Key Features of the Migration**

### **Database Schema**

```
Users ←→ User_Interests ←→ Interests
  ↓
Room_Members ←→ Rooms
  ↓
Chats (with isAiResponse field for AI messages)
```

### **Security Features**

- **Row Level Security**: Only room members can view messages
- **Authentication**: Users can only modify their own data
- **Foreign Keys**: Maintains data integrity
- **Unique Constraints**: Prevents duplicate relationships

### **Performance Features**

- **Optimized Indexes**: Fast queries on frequently used columns
- **Composite Indexes**: Efficient room-based message retrieval
- **Auto-timestamps**: Automatic `createdAt`/`updatedAt` management

## 🧪 **Test Your Setup**

After running the migration, test it with this SQL query:

```sql
-- Verify all tables were created
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns
        WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

You should see 6 tables with the expected column counts.

## ✅ **Ready to Go!**

Once you've run the migration:

1. **Start your NestJS app**: `npm run start:dev`
2. **Test user registration** and room creation
3. **Send messages** and watch the AI responses
4. **Verify real-time WebSocket** functionality

Your database is now fully set up and ready for the AI-powered chat application! The migration includes everything needed for user management, chat rooms, AI responses, and real-time messaging.

Check the `SUPABASE_SETUP.md` file for detailed troubleshooting and customization options. 🎉
