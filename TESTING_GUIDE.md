# Chat & Rooms Testing Guide

This guide shows you how to test all the chat and rooms functionality in your NestJS Chat App.

## Prerequisites

1. Start the development server:

```bash
npm run start:dev
```

2. The API will be available at: `http://localhost:3000`
3. WebSocket gateway runs on port: `8001` at namespace `/chats`

## 1. Authentication Setup

First, you need to authenticate to get a JWT token for testing protected endpoints.

### Register a New User

**POST** `http://localhost:3000/auth/register`

```json
{
  "email": "test@example.com",
  "password": "password123",
  "username": "testuser"
}
```

### Login

**POST** `http://localhost:3000/auth/login`

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

Save the `access_token` for use in subsequent requests.

## 2. Testing Rooms (REST API)

All room endpoints require authentication. Add header: `Authorization: Bearer YOUR_ACCESS_TOKEN`

### Create a Room

**POST** `http://localhost:3000/rooms`

**Personal Room:**

```json
{
  "type": "personal",
  "members": ["USER_ID_1", "USER_ID_2"]
}
```

**Group Room:**

```json
{
  "name": "My Group Chat",
  "type": "group",
  "members": ["USER_ID_1", "USER_ID_2", "USER_ID_3"]
}
```

### Get Your Rooms

**GET** `http://localhost:3000/rooms`

Returns all rooms the authenticated user is a member of.

### Get Chats in a Room

**GET** `http://localhost:3000/rooms/{ROOM_ID}/chats`

Query parameters:

- `skip`: Number of messages to skip (pagination)
- `take`: Number of messages to take (default: 20)

## 3. Testing Chats (REST API)

### Get Chats

**GET** `http://localhost:3000/chats/{ROOM_ID}`

Query parameters:

- `skip`: Number of messages to skip
- `take`: Number of messages to take

### Upload File to Chat

**POST** `http://localhost:3000/chats/{ROOM_ID}/upload`

Content-Type: `multipart/form-data`

Form data:

- `file`: The file to upload

### List Files in Room

**GET** `http://localhost:3000/chats/{ROOM_ID}/files`

Returns all uploaded files for the room.

## 4. Testing WebSocket Chat Functionality

WebSocket endpoint: `ws://localhost:8001/chats`

### Using a WebSocket Client

You can use tools like:

- **Postman** (WebSocket support)
- **wscat**: `npm install -g wscat`
- **Socket.IO client** in browser
- **Browser Developer Tools**

### Connection with Authentication

```javascript
// Using Socket.IO client
const socket = io('http://localhost:8001/chats', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN',
  },
});
```

### WebSocket Events

#### 1. Join a Room

**Event:** `join-room`

```json
{
  "roomId": "YOUR_ROOM_ID"
}
```

**Response:** `joined-room`

```json
{
  "roomId": "YOUR_ROOM_ID"
}
```

#### 2. Send a Message

**Event:** `create`

```json
{
  "room_id": "YOUR_ROOM_ID",
  "content": "Hello, this is my message!"
}
```

**Response:** `new-chat` (broadcast to all room members)

```json
{
  "id": "chat_id",
  "content": "Hello, this is my message!",
  "room_id": "YOUR_ROOM_ID",
  "sender": { ... },
  "messageType": "user",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### 3. AI Response (Automatic)

When you send a message, the AI service will automatically generate a response and broadcast it:

**Event:** `new-chat` (received)

```json
{
  "id": "ai_chat_id",
  "content": "AI generated response to your message",
  "room_id": "YOUR_ROOM_ID",
  "sender": { "username": "AI Assistant" },
  "messageType": "ai",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### 4. Leave a Room

**Event:** `leave-room`

```json
{
  "roomId": "YOUR_ROOM_ID"
}
```

**Response:** `left-room`

```json
{
  "roomId": "YOUR_ROOM_ID"
}
```

## 5. Complete Testing Workflow

### Step 1: Authentication

1. Register or login to get access token
2. Save the token for API calls

### Step 2: Create Users and Rooms

1. Create multiple test users
2. Create a group room with multiple members
3. Note the room ID from response

### Step 3: Test REST API

1. Get rooms list
2. Upload a file to the room
3. List files in the room
4. Get chat history

### Step 4: Test WebSocket Chat

1. Connect to WebSocket with auth token
2. Join the room
3. Send messages
4. Observe AI responses
5. Test with multiple connected clients

## 6. Testing with cURL

### Register User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"testuser"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Create Room

```bash
curl -X POST http://localhost:3000/rooms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room","type":"group","members":["user1","user2"]}'
```

### Get Rooms

```bash
curl -X GET http://localhost:3000/rooms \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 7. Testing with wscat

### Install wscat

```bash
npm install -g wscat
```

### Connect to WebSocket

```bash
wscat -c "ws://localhost:8001/chats?token=YOUR_ACCESS_TOKEN"
```

### Send Events

```bash
# Join room
{"event":"join-room","data":{"roomId":"YOUR_ROOM_ID"}}

# Send message
{"event":"create","data":{"room_id":"YOUR_ROOM_ID","content":"Hello World!"}}
```

## 8. Expected Features

✅ **User Authentication** - JWT-based auth  
✅ **Room Management** - Create personal/group rooms  
✅ **Real-time Messaging** - WebSocket-based chat  
✅ **AI Integration** - Automatic AI responses  
✅ **File Upload** - Upload files to chat rooms  
✅ **Chat History** - Retrieve previous messages  
✅ **Room Membership** - Join/leave rooms

## 9. Error Handling

### Common Errors:

- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User not member of room
- `404 Not Found` - Room or chat not found
- `chat-error` WebSocket event - Authentication or validation errors

### WebSocket Error Event:

```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

This guide covers all the functionality you can test in your chat application!
