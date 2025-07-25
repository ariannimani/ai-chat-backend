# 🤖 AI-Powered NestJS Chat Application

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
  <span style="margin: 0 20px; font-size: 24px;">+</span>
  <img src="https://avatars.githubusercontent.com/u/126733545?s=200&v=4" width="120" alt="LangChain Logo" />
</p>

<p align="center">
  A sophisticated real-time chat application powered by AI, built with NestJS, PostgreSQL, and advanced AI integration using LangChain & Groq
</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <img src="https://img.shields.io/badge/AI-Powered-brightgreen" alt="AI Powered" />
  <img src="https://img.shields.io/badge/Real--time-WebSocket-blue" alt="Real-time" />
</p>

## 🌟 Overview

This is an advanced, AI-powered real-time chat application that combines the robustness of NestJS with cutting-edge AI capabilities. Originally forked from a basic chat application, it has been extensively enhanced with:

- **🤖 AI-Powered Conversations** - Every message gets an intelligent AI response
- **⚡ Real-time Communication** - WebSocket-based instant messaging
- **🗄️ Modern Database** - PostgreSQL with Supabase integration
- **🔐 Dual Authentication** - JWT and Supabase Auth support
- **📁 File Sharing** - Upload and share files in chat rooms
- **🧠 Conversation Memory** - AI remembers context per chat room
- **📊 AI Observability** - LangSmith integration for AI monitoring

## ✨ Key Features

### 🤖 **AI Integration**
- **Automatic AI Responses**: Every user message triggers an intelligent AI response using Groq's fast LLM
- **Dual-Layer Memory System**: Separate memory contexts for individual users and shared room collaboration
  - **User Memory**: Tracks each user's personal conversation history ("What was my last question?")
  - **Room Memory**: Maintains shared collaborative context for group storytelling and discussions
  - **Smart Context Switching**: Automatically detects personal vs collaborative queries and prioritizes appropriate memory
- **Context Awareness**: AI knows user identity, room context, and conversation history
- **LangSmith Tracing**: Full observability and debugging of AI interactions
- **Model**: Powered by `llama3-70b-8192` for fast, intelligent responses

### 💬 **Real-Time Chat System**
- **WebSocket Communication**: Instant bi-directional messaging using Socket.IO
- **Room Management**: Create and join personal or group chat rooms
- **Live Broadcasting**: Messages instantly broadcast to all room members
- **Message Persistence**: Full chat history stored in PostgreSQL
- **File Uploads**: Share files and media using Supabase Storage

### 🔐 **Advanced Authentication**
- **Dual Auth System**: Choose between JWT or Supabase authentication
- **Secure Sessions**: JWT token-based session management
- **Password Security**: bcrypt hashing with secure password handling
- **WebSocket Auth**: Authenticated real-time connections

### 👥 **User Management**
- **Rich Profiles**: Users with interests, personal info, and relationships
- **Interest Matching**: Many-to-many user-interest relationships
- **Room Membership**: Flexible room member management
- **User Validation**: Comprehensive input validation and sanitization

### 🗄️ **Modern Database Architecture**
- **PostgreSQL**: Robust relational database via Supabase
- **TypeORM**: Type-safe database operations with entity relationships
- **Real-time Subscriptions**: Supabase channels for additional real-time features
- **Migration System**: Complete migration from MongoDB to PostgreSQL

## 🛠️ Technologies & Stack

### **Core Framework**
- **[NestJS](https://nestjs.com/)** (v10.0.0) - Progressive Node.js framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Node.js](https://nodejs.org/)** - Runtime environment

### **AI & Machine Learning**
- **[LangChain](https://js.langchain.com/)** (v0.3.2) - AI application framework
- **[Groq](https://groq.com/)** - Ultra-fast LLM inference
- **[LangSmith](https://smith.langchain.com/)** (v0.2.3) - AI observability platform
- **Model**: `llama3-70b-8192` - Optimized for conversational AI

### **Database & Storage**
- **[PostgreSQL](https://www.postgresql.org/)** - Primary database
- **[Supabase](https://supabase.com/)** (v2.52.0) - Backend-as-a-Service
- **[TypeORM](https://typeorm.io/)** (v0.3.17) - Database ORM
- **Supabase Storage** - File storage with CDN delivery

### **Real-Time Communication**
- **[Socket.IO](https://socket.io/)** (v4.7.4) - WebSocket library
- **[@nestjs/websockets](https://docs.nestjs.com/websockets/gateways)** - NestJS WebSocket integration
- **Real-time Subscriptions** - Supabase channels

### **Authentication & Security**
- **[Passport](http://www.passportjs.org/)** (v0.7.0) - Authentication middleware
- **[@nestjs/jwt](https://docs.nestjs.com/security/authentication)** (v10.2.0) - JWT integration
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** (v5.1.1) - Password hashing
- **nestjs-supabase-auth** (v1.0.9) - Supabase authentication

### **API & Validation**
- **[@nestjs/swagger](https://docs.nestjs.com/openapi/introduction)** (v7.3.0) - API documentation
- **[class-validator](https://github.com/typestack/class-validator)** (v0.14.1) - Input validation
- **[class-transformer](https://github.com/typestack/class-transformer)** (v0.5.1) - Data transformation

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (via Supabase)
- Groq API key
- LangSmith API key (optional, for AI tracing)

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-chat-backend

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file with the following variables:

```env
# Database Configuration (Supabase PostgreSQL)
SUPABASE_DB_HOST=db.your-project-ref.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-database-password
SUPABASE_DB_NAME=postgres

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRATION=7d

# AI Configuration (Required)
GROQ_API_KEY=your-groq-api-key-here
LANGSMITH_API_KEY=your-langsmith-api-key-here
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=nestjs-chat-ai

# Environment
NODE_ENV=development
```

### 3. Database Setup

Run the provided SQL migration in your Supabase dashboard:

```bash
# The supabase_migration.sql file contains all necessary tables and relationships
# Copy its contents to Supabase SQL Editor and execute
```

### 4. Seed Initial Data

```bash
# Seed interests data
npm run seed:app
```

### 5. Start the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

The application will be available at:
- **REST API**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:8080/chats`
- **API Documentation**: `http://localhost:3000/docs` (Swagger)

### 🧪 Test Client
For easy testing, use the provided HTML test client:

```bash
# Open the test client in your browser
start test-client.html
# or double-click the test-client.html file
```

The test client provides:
- 🔐 Pre-configured JWT token for testing
- 🏠 Room creation and management
- 💬 Real-time AI chat testing
- 📊 Live connection monitoring
- 🚀 One-click test messages

## 📡 API Reference

### **Authentication Endpoints**
```http
POST /auth/register     # Register new user
POST /auth/login        # User login
GET  /auth/me          # Get current user (JWT)
GET  /auth/supabase/me # Get current user (Supabase)
```

### **Chat & Room Endpoints**
```http
GET  /rooms                    # List user's rooms
POST /rooms                    # Create new room
GET  /chats/:roomId           # Get chat history
POST /chats/:roomId/upload    # Upload file to room
GET  /chats/:roomId/files     # List room files
```

### **User & Interest Endpoints**
```http
GET  /users/me         # Get user profile
PUT  /users/me         # Update user profile
GET  /interests        # List all interests
```

### **WebSocket Events**
```javascript
// Join a room
socket.emit('join-room', { roomId: 'room-uuid' });

// Send message
socket.emit('create', {
  content: 'Hello, AI!',
  room_id: 'room-uuid'
});

// Listen for messages
socket.on('new-chat', (message) => {
  if (message.messageType === 'user') {
    // Handle user message
  } else if (message.messageType === 'ai') {
    // Handle AI response
  }
});
```

## 🏗️ Architecture Overview

### **Database Schema**
```
Users ←→ User_Interests ←→ Interests
  ↓
Room_Members ←→ Rooms
  ↓
Chats (with isAiResponse field)
```

### **AI Message Flow**
1. **User Message** → WebSocket receives → Database save → Broadcast to room
2. **AI Processing** → LangChain + Groq → Generate contextual response
3. **AI Response** → Database save → Broadcast to room → LangSmith tracing

### **Real-Time Features**
- **WebSocket Gateway** - Instant messaging with Socket.IO
- **Supabase Channels** - Additional real-time subscriptions
- **Room Management** - Join/leave rooms dynamically
- **File Sharing** - Real-time file upload notifications

## 🧪 Testing

### **Run Tests**
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### **Manual Testing**
Use the provided testing tools:
- `debug-websocket.html` - WebSocket client for testing
- `test-client.html` - HTTP client for API testing
- `TESTING_GUIDE.md` - Comprehensive testing guide

## 📁 Project Structure

```
src/
├── ai/                 # AI service with LangChain integration
├── auth/              # Authentication (JWT + Supabase)
├── chats/             # Chat system with WebSocket gateway
├── config/            # Configuration, guards, middleware
├── interests/         # User interests management
├── rooms/             # Chat room management
├── users/             # User management and profiles
└── main.ts           # Application entry point
```

## 🔧 Configuration

### **AI Configuration**
- **Model**: `llama3-70b-8192` (configurable in `ai.service.ts`)
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Max Tokens**: 1000 (response length limit)
- **Memory**: BufferMemory per room for conversation context

### **WebSocket Configuration**
- **Port**: 8080 (configurable)
- **Namespace**: `/chats`
- **CORS**: Enabled for development
- **Authentication**: JWT-based per message

### **Database Configuration**
- **Synchronization**: Enabled in development
- **SSL**: Enabled for production
- **Connection pooling**: Automatic via TypeORM

## 🚀 Deployment

### **Environment Variables for Production**
```env
NODE_ENV=production
# ... other production-specific variables
```

### **Production Considerations**
- Disable database synchronization (`synchronize: false`)
- Use proper database migrations
- Set up monitoring and logging
- Configure rate limiting for AI requests
- Implement proper error handling
- Set up SSL certificates

## 📊 Monitoring & Observability

### **LangSmith Integration**
- **AI Tracing**: Monitor all AI interactions
- **Performance Metrics**: Response times and token usage
- **Error Tracking**: AI-specific error monitoring
- **Conversation Analytics**: Analyze chat patterns

### **Application Monitoring**
- **Logs**: Structured logging with NestJS Logger
- **Health Checks**: Built-in health check endpoints
- **Metrics**: Database query performance
- **WebSocket Monitoring**: Connection and message metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED License.

## 🙏 Acknowledgments

- **NestJS Team** - For the amazing framework
- **LangChain** - For the AI integration capabilities
- **Groq** - For fast LLM inference
- **Supabase** - For the backend infrastructure
- **Socket.IO** - For real-time communication

---

**🎉 Ready to chat with AI!** Your intelligent chat application is now ready to provide engaging, context-aware conversations powered by cutting-edge AI technology.
