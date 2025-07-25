import { PromptTemplate } from '@langchain/core/prompts';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGroq } from '@langchain/groq';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import { Client } from 'langsmith';

// Phase 3: Memory configuration interface
interface MemoryConfig {
  roomMemoryTTL: number; // Time to live in minutes
  userMemoryTTL: number;
  cleanupInterval: number; // Cleanup interval in minutes
  maxRoomsPerService: number;
  maxUsersPerRoom: number;
}

// Phase 3: Memory analytics interface
interface MemoryAnalytics {
  totalRooms: number;
  totalUsers: number;
  memoryUsage: {
    roomMemoriesSize: number;
    userMemoriesSize: number;
  };
  lastCleanup: Date;
  conversationTypes: {
    personal: number;
    collaborative: number;
    mixed: number;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly llm: ChatGroq;

  // Phase 1: Dual-layer memory system
  // Room-level memory for shared collaborative context (stories, discussions)
  private readonly roomMemories: Map<string, BufferMemory> = new Map();

  // User-level memory for individual context (personal questions, user-specific history)
  // Structure: roomId -> userId -> BufferMemory
  private readonly userMemories: Map<string, Map<string, BufferMemory>> =
    new Map();

  // Phase 3: Memory metadata tracking
  private readonly roomLastAccess: Map<string, Date> = new Map();
  private readonly userLastAccess: Map<string, Map<string, Date>> = new Map();

  // Phase 3: Analytics tracking
  private readonly conversationTypeStats = {
    personal: 0,
    collaborative: 0,
    mixed: 0,
  };
  private lastCleanupTime: Date = new Date();

  // Phase 3: Configuration
  private readonly memoryConfig: MemoryConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private readonly langsmithClient: Client;

  constructor(private configService: ConfigService) {
    // Initialize Groq LLM
    this.llm = new ChatGroq({
      model: 'llama3-70b-8192', // Fast model for chat
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Initialize LangSmith for tracing
    this.langsmithClient = new Client({
      apiKey: this.configService.get<string>('LANGSMITH_API_KEY'),
      apiUrl: 'https://api.smith.langchain.com',
    });

    // Phase 3: Initialize memory configuration
    this.memoryConfig = {
      roomMemoryTTL:
        this.configService.get<number>('AI_ROOM_MEMORY_TTL') || 1440, // 24 hours
      userMemoryTTL:
        this.configService.get<number>('AI_USER_MEMORY_TTL') || 720, // 12 hours
      cleanupInterval:
        this.configService.get<number>('AI_CLEANUP_INTERVAL') || 60, // 1 hour
      maxRoomsPerService: this.configService.get<number>('AI_MAX_ROOMS') || 100,
      maxUsersPerRoom:
        this.configService.get<number>('AI_MAX_USERS_PER_ROOM') || 50,
    };

    // Phase 3: Start cleanup timer
    this.startMemoryCleanup();

    this.logger.log(
      'AI service initialized with Groq, LangSmith, and dual-layer memory system with Phase 3 optimizations',
    );
  }

  /**
   * Phase 3: Start automatic memory cleanup
   */
  private startMemoryCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(
      () => {
        this.performMemoryCleanup();
      },
      this.memoryConfig.cleanupInterval * 60 * 1000,
    );

    this.logger.log(
      `Memory cleanup scheduled every ${this.memoryConfig.cleanupInterval} minutes`,
    );
  }

  /**
   * Phase 3: Perform memory cleanup for inactive rooms and users
   */
  private performMemoryCleanup(): void {
    const now = new Date();
    let cleanedRooms = 0;
    let cleanedUsers = 0;

    // Clean up inactive rooms
    for (const [roomId, lastAccess] of this.roomLastAccess.entries()) {
      const minutesSinceAccess =
        (now.getTime() - lastAccess.getTime()) / (1000 * 60);

      if (minutesSinceAccess > this.memoryConfig.roomMemoryTTL) {
        this.roomMemories.delete(roomId);
        this.roomLastAccess.delete(roomId);
        this.userMemories.delete(roomId);
        this.userLastAccess.delete(roomId);
        cleanedRooms++;
      }
    }

    // Clean up inactive users within active rooms
    for (const [roomId, userAccessMap] of this.userLastAccess.entries()) {
      if (!this.roomMemories.has(roomId)) continue;

      const roomUserMemories = this.userMemories.get(roomId);
      if (!roomUserMemories) continue;

      for (const [userId, lastAccess] of userAccessMap.entries()) {
        const minutesSinceAccess =
          (now.getTime() - lastAccess.getTime()) / (1000 * 60);

        if (minutesSinceAccess > this.memoryConfig.userMemoryTTL) {
          roomUserMemories.delete(userId);
          userAccessMap.delete(userId);
          cleanedUsers++;
        }
      }

      // If no users left in room, clean up the room too
      if (roomUserMemories.size === 0) {
        this.roomMemories.delete(roomId);
        this.roomLastAccess.delete(roomId);
        this.userMemories.delete(roomId);
        this.userLastAccess.delete(roomId);
        cleanedRooms++;
      }
    }

    this.lastCleanupTime = now;

    if (cleanedRooms > 0 || cleanedUsers > 0) {
      this.logger.log(
        `Memory cleanup completed: ${cleanedRooms} rooms, ${cleanedUsers} users removed`,
      );
    }
  }

  /**
   * Phase 3: Update access timestamps for memory management
   */
  private updateAccessTimestamps(roomId: string, userId: string): void {
    const now = new Date();

    // Update room access
    this.roomLastAccess.set(roomId, now);

    // Update user access
    if (!this.userLastAccess.has(roomId)) {
      this.userLastAccess.set(roomId, new Map());
    }
    this.userLastAccess.get(roomId)!.set(userId, now);
  }

  /**
   * Phase 3: Check memory limits and enforce them
   */
  private async enforceMemoryLimits(): Promise<void> {
    // Check room count limit
    if (this.roomMemories.size > this.memoryConfig.maxRoomsPerService) {
      const oldestRooms = Array.from(this.roomLastAccess.entries())
        .sort((a, b) => a[1].getTime() - b[1].getTime())
        .slice(
          0,
          this.roomMemories.size - this.memoryConfig.maxRoomsPerService,
        );

      for (const [roomId] of oldestRooms) {
        this.clearRoomMemory(roomId);
      }
    }

    // Check user count per room limit
    for (const [roomId, userMap] of this.userMemories.entries()) {
      if (userMap.size > this.memoryConfig.maxUsersPerRoom) {
        const roomUserAccess = this.userLastAccess.get(roomId);
        if (!roomUserAccess) continue;

        const oldestUsers = Array.from(roomUserAccess.entries())
          .sort((a, b) => a[1].getTime() - b[1].getTime())
          .slice(0, userMap.size - this.memoryConfig.maxUsersPerRoom);

        for (const [userId] of oldestUsers) {
          userMap.delete(userId);
          roomUserAccess.delete(userId);
        }
      }
    }
  }

  /**
   * Phase 1: Get or create shared room memory for collaborative context
   * Phase 3: Enhanced with configurable limits and access tracking
   * Fixed: Using BufferMemory to avoid tiktoken issues with Groq model
   */
  private getRoomMemory(roomId: string): BufferMemory {
    if (!this.roomMemories.has(roomId)) {
      const memory = new BufferMemory({
        memoryKey: 'room_history',
        inputKey: 'input',
        outputKey: 'response',
        returnMessages: false,
      });
      this.roomMemories.set(roomId, memory);
      this.logger.log(`Created new shared room memory for room: ${roomId}`);
    }
    return this.roomMemories.get(roomId);
  }

  /**
   * Phase 1: Get or create user-specific memory within a room
   * Phase 3: Enhanced with configurable limits and access tracking
   */
  private getUserMemory(roomId: string, userId: string): BufferMemory {
    // Ensure room exists in user memories map
    if (!this.userMemories.has(roomId)) {
      this.userMemories.set(roomId, new Map());
    }

    const roomUserMemories = this.userMemories.get(roomId);

    // Ensure user exists in room's user memories
    if (!roomUserMemories.has(userId)) {
      const userMemory = new BufferMemory({
        memoryKey: 'user_history',
        inputKey: 'input',
        outputKey: 'response',
        returnMessages: false,
      });
      roomUserMemories.set(userId, userMemory);
      this.logger.log(
        `Created new user memory for user ${userId} in room: ${roomId}`,
      );
    }

    return roomUserMemories.get(userId);
  }

  /**
   * Phase 2: Enhanced context combination with intelligent prioritization
   * Combines room collaborative context with user-specific context intelligently
   */
  private async combineContexts(
    roomMemory: BufferMemory,
    userMemory: BufferMemory,
    currentMessage: string,
    username: string,
  ): Promise<{
    roomContext: string;
    userContext: string;
    contextPriority: 'user' | 'room' | 'balanced';
    conversationType: 'personal' | 'collaborative' | 'mixed';
  }> {
    const roomVariables = await roomMemory.loadMemoryVariables({});
    const userVariables = await userMemory.loadMemoryVariables({});

    const roomContext = roomVariables.room_history || '';
    const userContext = userVariables.user_history || '';

    // Phase 2: Intelligent conversation type detection
    const conversationType = this.detectConversationType(
      currentMessage,
      roomContext,
      userContext,
    );

    // Phase 2: Determine context priority based on message content
    const contextPriority = this.determineContextPriority(
      currentMessage,
      conversationType,
    );

    return {
      roomContext: this.formatRoomContext(roomContext),
      userContext: this.formatUserContext(userContext),
      contextPriority,
      conversationType,
    };
  }

  /**
   * Phase 2: Detect conversation type based on message content and context
   */
  private detectConversationType(
    message: string,
    roomContext: string,
    userContext: string,
  ): 'personal' | 'collaborative' | 'mixed' {
    const lowerMessage = message.toLowerCase();

    // Personal question indicators
    const personalIndicators = [
      'my last question',
      'what did i ask',
      'my previous request',
      'remind me what i',
      'what was i asking',
      'my question was',
      'i asked about',
    ];

    // Collaborative indicators
    const collaborativeIndicators = [
      'continue the story',
      'change it to',
      'make it',
      'no,',
      'instead',
      'build on',
      'add to',
      'modify',
      "let's",
      'we should',
      'our story',
      'the story',
      'that character',
    ];

    // Reference to others' work
    const othersWorkIndicators = [
      'what they said',
      'the previous',
      'from earlier',
      'that idea',
      'building on',
    ];

    const hasPersonalIndicators = personalIndicators.some((indicator) =>
      lowerMessage.includes(indicator),
    );

    const hasCollaborativeIndicators = collaborativeIndicators.some(
      (indicator) => lowerMessage.includes(indicator),
    );

    const hasOthersWorkIndicators = othersWorkIndicators.some((indicator) =>
      lowerMessage.includes(indicator),
    );

    // Determine conversation type
    if (hasPersonalIndicators && !hasCollaborativeIndicators) {
      return 'personal';
    }

    if (
      (hasCollaborativeIndicators || hasOthersWorkIndicators) &&
      roomContext.length > 0
    ) {
      return 'collaborative';
    }

    if (hasPersonalIndicators && hasCollaborativeIndicators) {
      return 'mixed';
    }

    // Default: if there's room context and the message could be building on it
    if (roomContext.length > 100 && !hasPersonalIndicators) {
      return 'collaborative';
    }

    return 'mixed';
  }

  /**
   * Phase 2: Determine context priority based on conversation type and content
   */
  private determineContextPriority(
    message: string,
    conversationType: 'personal' | 'collaborative' | 'mixed',
  ): 'user' | 'room' | 'balanced' {
    switch (conversationType) {
      case 'personal':
        return 'user';
      case 'collaborative':
        return 'room';
      case 'mixed':
        return 'balanced';
      default:
        return 'balanced';
    }
  }

  /**
   * Phase 2: Format room context for better presentation
   */
  private formatRoomContext(roomContext: string): string {
    if (!roomContext) return '';

    // Clean up and format room context - remove technical formatting
    const formatted = roomContext
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        // Clean up the format to be more natural
        // Remove "Human:" and "AI:" prefixes if they exist
        return line
          .replace(/^Human:\s*/, '')
          .replace(/^AI:\s*/, '')
          .replace(/^Assistant:\s*/, '')
          .trim();
      })
      .filter((line) => line.length > 0)
      .slice(-8) // Keep last 8 interactions to avoid token overflow
      .join('\n');

    return formatted;
  }

  /**
   * Phase 2: Format user context for better presentation
   */
  private formatUserContext(userContext: string): string {
    if (!userContext) return '';

    // Clean up and format user context - remove technical formatting
    const formatted = userContext
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        // Clean up the format to be more natural
        return line
          .replace(/^Human:\s*/, '')
          .replace(/^AI:\s*/, '')
          .replace(/^Assistant:\s*/, '')
          .trim();
      })
      .filter((line) => line.length > 0)
      .slice(-5) // Keep last 5 user interactions
      .join('\n');

    return formatted;
  }

  /**
   * Phase 2: Create context-aware prompt based on conversation type and priority
   */
  private createContextAwarePrompt(
    contextPriority: 'user' | 'room' | 'balanced',
    conversationType: 'personal' | 'collaborative' | 'mixed',
  ): PromptTemplate {
    switch (conversationType) {
      case 'personal':
        return this.createPersonalPrompt();
      case 'collaborative':
        return this.createCollaborativePrompt();
      case 'mixed':
        return this.createBalancedPrompt();
      default:
        return this.createBalancedPrompt();
    }
  }

  /**
   * Phase 2: Personal conversation prompt template
   */
  private createPersonalPrompt(): PromptTemplate {
    return PromptTemplate.fromTemplate(`
You are a helpful AI assistant in a chat room. Focus on the user's personal conversation history and questions.

Room: {roomId} | User: {username} | Message: {input}

Personal conversation history:
{userContext}

Room background (for reference):
{roomContext}

Instructions:
- Answer based primarily on this user's personal history and context
- Use their personal conversation when they ask "my last question", "what did I ask", etc.
- Keep responses personal and direct, without exposing internal system details
- Don't mention context headers, priorities, or system information
- Don't repeat or reference the conversation history format in your response
- Be natural and conversational
- NEVER include phrases like "PERSONAL CONTEXT", "Priority: HIGH", or system formatting

Response:`);
  }

  /**
   * Phase 2: Collaborative conversation prompt template
   */
  private createCollaborativePrompt(): PromptTemplate {
    return PromptTemplate.fromTemplate(`
You are a helpful AI assistant facilitating collaborative work in a chat room.

Room: {roomId} | User: {username} | Message: {input}

Shared conversation history:
{roomContext}

User's background:
{userContext}

Instructions:
- Build upon the shared conversation and collaborative work
- Continue stories, discussions, or group work naturally
- Acknowledge contributions from multiple users when relevant
- Maintain conversation flow without exposing system internals
- Don't mention context priorities, headers, or technical details
- Don't repeat or reference the conversation history format in your response
- Be natural and engaging
- NEVER include phrases like "SHARED COLLABORATIVE CONTEXT", "Priority: HIGH", or system formatting

Response:`);
  }

  /**
   * Phase 2: Balanced conversation prompt template
   */
  private createBalancedPrompt(): PromptTemplate {
    return PromptTemplate.fromTemplate(`
You are a helpful AI assistant in a chat room that handles both personal and collaborative conversations naturally.

Room: {roomId} | User: {username} | Message: {input}

Shared room conversation:
{roomContext}

User's personal conversation:
{userContext}

Instructions:
- Determine if the message is personal ("my question") or collaborative ("continue the story")
- Use the appropriate context based on what the user is asking
- Maintain natural conversation flow
- Don't expose system information, context headers, or technical details
- Don't repeat or reference the conversation history format in your response
- Be conversational and helpful
- NEVER include phrases like "SHARED CONTEXT", "Priority", or system formatting

Response:`);
  }

  /**
   * Generate AI response for a user message in a specific room
   * Phase 2: Enhanced with intelligent context routing and conversation type detection
   * Phase 3: Enhanced with access tracking, analytics, and memory management
   * Fixed: Always use user memory for chain to maintain proper user context
   */
  async generateResponse(
    roomId: string,
    userId: string,
    username: string,
    message: string,
  ): Promise<string> {
    try {
      // Phase 3: Update access timestamps and enforce limits
      this.updateAccessTimestamps(roomId, userId);
      await this.enforceMemoryLimits();

      const roomMemory = this.getRoomMemory(roomId);
      const userMemory = this.getUserMemory(roomId, userId);

      // Phase 2: Enhanced context combination with intelligence
      const { roomContext, userContext, contextPriority, conversationType } =
        await this.combineContexts(roomMemory, userMemory, message, username);

      // Phase 3: Update analytics
      this.conversationTypeStats[conversationType]++;

      // Phase 2: Use appropriate prompt template based on conversation type
      const prompt = this.createContextAwarePrompt(
        contextPriority,
        conversationType,
      );

      // IMPROVED: Use ConversationChain with user memory for proper context tracking
      // This ensures "what was my last question" works correctly per user
      const chain = new ConversationChain({
        llm: this.llm,
        memory: userMemory, // Always user memory for proper user context
        prompt: prompt,
      });

      // Generate response with enhanced context and conversation awareness
      const response = await chain.predict({
        input: message,
        roomId: roomId,
        userId: userId,
        username: username,
        roomContext: roomContext,
        userContext: userContext,
      });

      // Phase 2: Enhanced memory saving with conversation type awareness
      // Only save to room memory for collaborative content (user memory handled by chain)
      if (
        conversationType === 'collaborative' ||
        conversationType === 'mixed'
      ) {
        await this.saveToRoomMemory(roomMemory, username, message, response);
      }

      this.logger.log(
        `Generated AI response for room ${roomId}, user ${username} using ${conversationType} conversation type with ${contextPriority} priority`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to generate AI response: ${error.message}`,
        error.stack,
      );
      return 'Sorry, I encountered an error while processing your message. Please try again.';
    }
  }

  /**
   * Phase 1: Enhanced room memory saving for collaborative context
   * Save interactions to shared room memory with cleaner formatting
   */
  private async saveToRoomMemory(
    roomMemory: BufferMemory,
    username: string,
    userMessage: string,
    aiResponse: string,
  ): Promise<void> {
    try {
      // Use cleaner formatting for room memory - avoid technical formatting
      const roomInput = `User ${username} said: ${userMessage}`;
      const cleanResponse = aiResponse
        .replace(/^(AI|Assistant):\s*/i, '')
        .trim();

      await roomMemory.saveContext(
        { input: roomInput },
        { response: `Assistant replied: ${cleanResponse}` },
      );
    } catch (error) {
      this.logger.warn(`Failed to save to room memory: ${error.message}`);
    }
  }

  /**
   * Clear memory for a specific room (useful for cleanup or reset)
   * Phase 1: Enhanced to clear both memory layers
   * Phase 3: Enhanced with access tracking cleanup
   */
  clearRoomMemory(roomId: string): void {
    this.roomMemories.delete(roomId);
    this.roomLastAccess.delete(roomId);
    this.logger.log(`Cleared shared room memory for room: ${roomId}`);

    // Clear user-specific memories for the room
    this.userMemories.delete(roomId);
    this.userLastAccess.delete(roomId);
    this.logger.log(`Cleared all user memories for room: ${roomId}`);
  }

  /**
   * Phase 3: Clear specific user memory within a room
   */
  clearUserMemory(roomId: string, userId: string): void {
    const roomUserMemories = this.userMemories.get(roomId);
    const roomUserAccess = this.userLastAccess.get(roomId);

    if (roomUserMemories) {
      roomUserMemories.delete(userId);
    }

    if (roomUserAccess) {
      roomUserAccess.delete(userId);
    }

    this.logger.log(
      `Cleared user memory for user ${userId} in room: ${roomId}`,
    );
  }

  /**
   * Phase 1: Get user-specific conversation history
   * Returns this user's personal conversation history in the room
   */
  async getUserHistory(roomId: string, userId: string): Promise<string> {
    const userMemory = this.getUserMemory(roomId, userId);
    const history = await userMemory.loadMemoryVariables({});
    return history.user_history || '';
  }

  /**
   * Get conversation history for a room
   * Phase 1: Enhanced to return shared collaborative context
   */
  async getRoomHistory(roomId: string): Promise<string> {
    const roomMemory = this.getRoomMemory(roomId);
    const history = await roomMemory.loadMemoryVariables({});
    return history.room_history || '';
  }

  /**
   * Phase 1: Memory statistics for debugging and monitoring
   */
  getMemoryStats(): { totalRooms: number; totalUsers: number } {
    let totalUsers = 0;
    this.userMemories.forEach((roomUsers) => {
      totalUsers += roomUsers.size;
    });

    return {
      totalRooms: this.roomMemories.size,
      totalUsers: totalUsers,
    };
  }

  /**
   * Phase 3: Enhanced memory statistics with detailed analytics
   */
  getMemoryAnalytics(): MemoryAnalytics {
    let totalUsers = 0;
    let roomMemoriesSize = 0;
    let userMemoriesSize = 0;

    this.userMemories.forEach((roomUsers) => {
      totalUsers += roomUsers.size;
      userMemoriesSize += roomUsers.size;
    });

    roomMemoriesSize = this.roomMemories.size;

    return {
      totalRooms: this.roomMemories.size,
      totalUsers: totalUsers,
      memoryUsage: {
        roomMemoriesSize,
        userMemoriesSize,
      },
      lastCleanup: this.lastCleanupTime,
      conversationTypes: { ...this.conversationTypeStats },
    };
  }

  /**
   * Phase 3: Get memory configuration
   */
  getMemoryConfig(): MemoryConfig {
    return { ...this.memoryConfig };
  }

  /**
   * Phase 3: Update memory configuration (hot reload)
   */
  updateMemoryConfig(newConfig: Partial<MemoryConfig>): void {
    Object.assign(this.memoryConfig, newConfig);

    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval) {
      this.startMemoryCleanup();
    }

    this.logger.log('Memory configuration updated');
  }

  /**
   * Phase 3: Manual memory cleanup trigger
   */
  triggerMemoryCleanup(): { cleanedRooms: number; cleanedUsers: number } {
    const beforeRooms = this.roomMemories.size;
    const beforeUsers = Array.from(this.userMemories.values()).reduce(
      (total, map) => total + map.size,
      0,
    );

    this.performMemoryCleanup();

    const afterRooms = this.roomMemories.size;
    const afterUsers = Array.from(this.userMemories.values()).reduce(
      (total, map) => total + map.size,
      0,
    );

    return {
      cleanedRooms: beforeRooms - afterRooms,
      cleanedUsers: beforeUsers - afterUsers,
    };
  }

  /**
   * Phase 3: Reset all analytics counters
   */
  resetAnalytics(): void {
    this.conversationTypeStats.personal = 0;
    this.conversationTypeStats.collaborative = 0;
    this.conversationTypeStats.mixed = 0;
    this.lastCleanupTime = new Date();
    this.logger.log('Analytics counters reset');
  }

  /**
   * Phase 3: Cleanup on service destruction
   */
  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.logger.log('AI service cleanup completed');
  }
}
