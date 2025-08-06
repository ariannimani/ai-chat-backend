# Multi-Provider AI System with Separated Configuration

This NestJS chat application now supports multiple AI providers with a **separated AI configuration architecture**, allowing you to configure different AI models for each room while **preserving full conversation history across model changes**, similar to how Cursor works.

## 🏗️ **Architecture Overview**

### **Separated AI Configuration**

- **`rooms` table**: Contains basic room information (name, type, members)
- **`ai_configs` table**: Contains AI-specific configuration (provider, model, settings)
- **1:1 Relationship**: Each room has exactly one AI configuration
- **History Persistence**: Conversation history is stored by room ID, not AI model

### **Key Benefits**

- ✅ **Full History Preservation**: Switch AI models without losing conversation context
- ✅ **Clean Architecture**: AI settings separated from core room data
- ✅ **Easy Model Switching**: Change providers/models seamlessly
- ✅ **Backward Compatibility**: Existing conversations remain accessible

## Supported Providers

### 1. OpenAI

- **Models**: GPT-4o, GPT-4o Mini, GPT-3.5 Turbo, o1 Preview, o1 Mini
- **Features**: Function calling, vision capabilities, streaming
- **API Key**: `OPENAI_API_KEY`

### 2. Google Gemini

- **Models**: Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash
- **Features**: Large context windows, multimodal capabilities, function calling
- **API Key**: `GEMINI_API_KEY`

### 3. Groq (Default)

- **Models**: Llama 3 70B, Llama 3 8B, Mixtral 8x7B, Gemma 2 9B
- **Features**: Ultra-fast inference, high performance
- **API Key**: `GROQ_API_KEY`

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Groq Configuration (already configured)
GROQ_API_KEY=your_groq_api_key_here
```

### Database Schema

#### Rooms Table

```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY,
  name VARCHAR,
  type VARCHAR,
  ai_instructions TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### AI Configs Table (New)

```sql
CREATE TABLE ai_configs (
  id UUID PRIMARY KEY,
  room_id UUID UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
  provider VARCHAR CHECK (provider IN ('openai', 'gemini', 'groq')),
  model VARCHAR NOT NULL,
  instructions TEXT,
  temperature NUMERIC(3,2) CHECK (temperature >= 0.0 AND temperature <= 2.0),
  max_tokens INTEGER CHECK (max_tokens >= 1 AND max_tokens <= 4000),
  top_p NUMERIC(3,2) CHECK (top_p >= 0.0 AND top_p <= 1.0),
  frequency_penalty NUMERIC(3,2) CHECK (frequency_penalty >= -2.0 AND frequency_penalty <= 2.0),
  presence_penalty NUMERIC(3,2) CHECK (presence_penalty >= -2.0 AND presence_penalty <= 2.0),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Room-Level Configuration

Each room's AI configuration is stored separately:

```typescript
interface AiConfig {
  id: string;
  roomId: string;
  provider: 'openai' | 'gemini' | 'groq';
  model: string;
  instructions?: string;
  temperature?: number; // 0.0 - 2.0
  max_tokens?: number; // 1 - 4000
  top_p?: number; // 0.0 - 1.0
  frequency_penalty?: number; // -2.0 - 2.0 (OpenAI only)
  presence_penalty?: number; // -2.0 - 2.0 (OpenAI only)
}
```

## API Endpoints

### Get Available Models

```http
GET /rooms/ai/models
```

Returns all available AI providers and their models.

```http
GET /rooms/ai/models/openai
```

Returns available models for a specific provider.

### Room AI Configuration

#### Get Room AI Config

```http
GET /rooms/:id/ai
```

#### Update Room AI Config (Preserves History)

```http
PUT /rooms/:id/ai
Content-Type: application/json

{
  "ai_provider": "openai",
  "ai_model": "gpt-4o-mini",
  "ai_temperature": 0.7,
  "ai_max_tokens": 1000,
  "ai_instructions": "You are a helpful coding assistant."
}
```

#### Switch AI Provider (History Preserved)

```http
PUT /rooms/:id/ai
Content-Type: application/json

{
  "ai_provider": "gemini",
  "ai_model": "gemini-1.5-pro",
  "ai_temperature": 0.8
}
```

### Create Room with AI Config

```http
POST /rooms
Content-Type: application/json

{
  "name": "My AI Room",
  "type": "GROUP",
  "ai_provider": "openai",
  "ai_model": "gpt-4o",
  "ai_temperature": 0.8,
  "ai_instructions": "You are an expert in software development."
}
```

## 🔄 **Conversation History Persistence**

### How It Works

1. **Room-Based Memory**: Conversation history is stored by `room_id`, not by AI model
2. **Dual-Layer System**:
   - **Room Memory**: Shared collaborative context
   - **User Memory**: Personal conversation history
3. **Provider Independence**: AI providers access the same conversation history
4. **Seamless Switching**: Change models mid-conversation without losing context

### Example Scenario

```typescript
// User starts conversation with Groq
POST /rooms/123/messages
{ "content": "Explain quantum computing" }
// Groq responds with detailed explanation

// User switches to OpenAI GPT-4o for follow-up
PUT /rooms/123/ai
{ "ai_provider": "openai", "ai_model": "gpt-4o" }

// User continues conversation
POST /rooms/123/messages
{ "content": "Can you give me a code example?" }
// GPT-4o has full context of previous quantum computing discussion
```

### Logging

The system logs provider switches while maintaining history:

```
[AI] 🔄 AI provider switched for room abc-123: groq/llama3-70b-8192 → openai/gpt-4o. Conversation history preserved.
[AI] Generated AI response for room abc-123, user john using openai/gpt-4o with collaborative conversation type and balanced priority. History preserved across provider changes.
```

## Model Recommendations

### For General Chat

- **OpenAI GPT-4o Mini**: Good balance of capability and speed
- **Gemini 1.5 Flash**: Fast responses with large context
- **Groq Llama 3 70B**: Ultra-fast inference

### For Code Assistance

- **OpenAI GPT-4o**: Best coding capabilities
- **OpenAI o1 Mini**: Advanced reasoning for complex problems

### For Creative Writing

- **OpenAI GPT-4o**: Excellent creative capabilities
- **Gemini 1.5 Pro**: Large context for long-form content

### For Fast Responses

- **Groq Models**: All Groq models offer ultra-fast inference
- **OpenAI GPT-3.5 Turbo**: Fast and efficient

## Usage Examples

### Frontend Integration

```typescript
// Get available models
const models = await fetch('/api/rooms/ai/models').then((r) => r.json());

// Switch AI provider mid-conversation (history preserved)
await fetch(`/api/rooms/${roomId}/ai`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ai_provider: 'openai',
    ai_model: 'gpt-4o-mini',
    ai_temperature: 0.7,
    ai_instructions: 'Continue our previous discussion.',
  }),
});

// Continue conversation - new model has full history
socket.emit('create-message', {
  room_id: roomId,
  content: 'Based on our previous discussion, can you elaborate?',
  id: 'message-uuid',
});
```

### WebSocket Messages

Messages automatically use the room's current AI configuration while preserving history:

```typescript
socket.emit('create-message', {
  room_id: 'room-uuid',
  content: 'Hello, how can you help me today?',
  id: 'message-uuid',
});
```

## Memory Management & History Persistence

The AI service maintains intelligent memory management with history preservation:

- **Room Memory**: Shared context for collaborative conversations (keyed by room ID)
- **User Memory**: Personal context for individual users (keyed by room ID + user ID)
- **Context Prioritization**: Automatically determines whether to use room or user context
- **Conversation Type Detection**: Identifies personal vs collaborative messages
- **Provider Independence**: Memory system is completely independent of AI provider/model

### Memory Architecture

```typescript
// Memory is stored by room ID, not AI model
private readonly roomMemories: Map<string, BufferMemory> = new Map(); // roomId -> memory
private readonly userMemories: Map<string, Map<string, BufferMemory>> = new Map(); // roomId -> userId -> memory

// AI provider can change without affecting memory
const roomMemory = this.getRoomMemory(roomId); // Always returns same memory for room
const userMemory = this.getUserMemory(roomId, userId); // Always returns same memory for user in room
```

## Migration

### Automatic Migration

The migration automatically moves existing AI configuration from the `rooms` table to the new `ai_configs` table:

```bash
npm run migration:run
```

### Migration Details

1. **Creates `ai_configs` table** with proper constraints
2. **Migrates existing data** from `rooms.ai_*` columns to `ai_configs` table
3. **Preserves all settings** and relationships
4. **Removes old columns** from `rooms` table
5. **Maintains conversation history** throughout the process

### Rollback Support

The migration includes a complete rollback that restores the original schema:

```bash
npm run migration:revert
```

## Architecture Benefits

### 🏗️ **Clean Separation**

- AI configuration isolated from core room data
- Easier to extend with new providers
- Better database normalization

### 🔄 **History Preservation**

- Conversation history survives model changes
- Users can experiment with different models
- No context loss when switching providers

### 📈 **Scalability**

- Independent scaling of AI configs
- Easier to add new AI parameters
- Better caching strategies possible

### 🔧 **Maintainability**

- Clear separation of concerns
- Easier testing and debugging
- Simplified AI provider management

## Troubleshooting

### Common Issues

1. **Missing AI Config**: If no AI config exists, system creates default Groq configuration
2. **History Not Preserved**: Check that room ID remains consistent across model changes
3. **Provider Switch Logs**: Look for `🔄 AI provider switched` messages in logs

### Debugging

```bash
# Check AI config for a room
GET /rooms/{roomId}/ai

# Monitor provider switches in logs
tail -f logs/application.log | grep "provider switched"

# Verify conversation history preservation
GET /rooms/{roomId}/messages
```

## Cost Optimization

- **Groq**: Free tier with high performance
- **OpenAI**: Pay-per-token, consider GPT-4o Mini for cost savings
- **Gemini**: Competitive pricing with large context windows
- **Model Switching**: Switch to cheaper models for simple tasks, premium models for complex ones

Configure different providers for different use cases to optimize costs while maintaining full conversation history.
