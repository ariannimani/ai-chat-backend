import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BufferMemory } from 'langchain/memory';
import { Client } from 'langsmith';
import { AiAttachmentService } from '../attachments/services/ai-attachment.service';
import { AiProviderFactory } from './ai-provider.factory';
import {
  AVAILABLE_MODELS,
  AiChatMessage,
  AiProvider,
  AiProviderConfig,
  BaseAiProvider,
} from './ai-provider.interface';

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

  private readonly langSmithClient: Client;

  constructor(
    private configService: ConfigService,
    private aiAttachmentService: AiAttachmentService,
  ) {
    // Initialize LangSmith for tracing
    this.langSmithClient = new Client({
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

    // AI service initialized
  }

  /**
   * Create AI provider instance based on room configuration
   * Enhanced with proper numeric type conversion to prevent API errors
   */
  private createAiProvider(roomConfig: {
    ai_provider: AiProvider;
    ai_model: string;
    ai_temperature?: number;
    ai_max_tokens?: number;
    ai_top_p?: number;
    ai_frequency_penalty?: number;
    ai_presence_penalty?: number;
  }): BaseAiProvider {
    // Ensure all numeric values are properly converted to numbers
    const temperature = roomConfig.ai_temperature
      ? Number(roomConfig.ai_temperature)
      : 0.7;
    const maxTokens = roomConfig.ai_max_tokens
      ? Number(roomConfig.ai_max_tokens)
      : 1000;
    const topP = roomConfig.ai_top_p ? Number(roomConfig.ai_top_p) : 1.0;
    const frequencyPenalty = roomConfig.ai_frequency_penalty
      ? Number(roomConfig.ai_frequency_penalty)
      : 0.0;
    const presencePenalty = roomConfig.ai_presence_penalty
      ? Number(roomConfig.ai_presence_penalty)
      : 0.0;

    // Validate numeric ranges to prevent API errors
    const validatedTemperature = Math.max(0.0, Math.min(2.0, temperature));
    const validatedMaxTokens = Math.max(1, Math.min(4000, maxTokens));
    const validatedTopP = Math.max(0.0, Math.min(1.0, topP));
    const validatedFrequencyPenalty = Math.max(
      -2.0,
      Math.min(2.0, frequencyPenalty),
    );
    const validatedPresencePenalty = Math.max(
      -2.0,
      Math.min(2.0, presencePenalty),
    );

    const config: AiProviderConfig = {
      provider: roomConfig.ai_provider,
      model: roomConfig.ai_model,
      apiKey: this.getApiKeyForProvider(roomConfig.ai_provider),
      temperature: validatedTemperature,
      maxTokens: validatedMaxTokens,
      topP: validatedTopP,
      frequencyPenalty: validatedFrequencyPenalty,
      presencePenalty: validatedPresencePenalty,
    };

    // Creating AI provider

    return AiProviderFactory.createProvider(config);
  }

  /**
   * Get API key for specific provider from environment variables
   */
  private getApiKeyForProvider(provider: AiProvider): string {
    switch (provider) {
      case AiProvider.OPENAI:
        return this.configService.get<string>('OPENAI_API_KEY') || '';
      case AiProvider.GEMINI:
        return this.configService.get<string>('GEMINI_API_KEY') || '';
      case AiProvider.GROQ:
        return this.configService.get<string>('GROQ_API_KEY') || '';
      default:
        throw new Error(`No API key configured for provider: ${provider}`);
    }
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
      // Created new shared room memory
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
      // User memory created (debug only if needed)
      // this.logger.debug(`Created user memory for ${userId} in room ${roomId}`);
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
    _userEmail: string,
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
    _userContext: string,
  ): 'personal' | 'collaborative' | 'mixed' {
    // Remove @ai prefix and normalize the message
    const cleanMessage = message
      .toLowerCase()
      .replace(/^@ai\s*/, '')
      .trim();

    // Personal question indicators
    const personalIndicators = [
      'my last question',
      'what did i ask',
      'what was my last question',
      'what was my last',
      'my previous request',
      'my previous question',
      'remind me what i',
      'what was i asking',
      'my question was',
      'i asked about',
      'what did i say',
      'what did i tell',
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
      cleanMessage.includes(indicator),
    );

    const hasCollaborativeIndicators = collaborativeIndicators.some(
      (indicator) => cleanMessage.includes(indicator),
    );

    const hasOthersWorkIndicators = othersWorkIndicators.some((indicator) =>
      cleanMessage.includes(indicator),
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
   * Read AI config attachments and return their content as context
   */
  private async readAiConfigAttachments(roomId: string): Promise<string> {
    try {
      return await this.aiAttachmentService.getAiAttachmentsContent(roomId);
    } catch (error) {
      this.logger.error(
        `Error reading AI config attachments for room ${roomId}: ${error.message}`,
      );
      return '';
    }
  }

  /**
   * Create context-aware messages for AI providers with attachment context
   */
  private createContextAwareMessages(
    roomContext: string,
    userContext: string,
    contextPriority: 'user' | 'room' | 'balanced',
    conversationType: 'personal' | 'collaborative' | 'mixed',
    aiInstructions: string,
    attachmentContext: string,
    userEmail: string,
    message: string,
  ): AiChatMessage[] {
    const messages: AiChatMessage[] = [];

    // System message based on conversation type
    let systemMessage = '';

    switch (conversationType) {
      case 'personal':
        systemMessage = `You are a helpful AI assistant in a chat room. Focus on the user's personal conversation history and questions.

Room: ${userEmail} | Message: ${message}

Personal conversation history:
${userContext}

Room background (for reference):
${roomContext}

${attachmentContext}

Instructions:
- Answer based primarily on this user's personal history and context
- Use the attachment content as additional context and reference material
- Use their personal conversation when they ask "my last question", "what did I ask", etc.
- Keep responses personal and direct, without exposing internal system details
- Don't mention context headers, priorities, or system information
- Don't repeat or reference the conversation history format in your response
- Be natural and conversational

${aiInstructions ? `Additional instructions: ${aiInstructions}` : ''}`;
        break;
      case 'collaborative':
        systemMessage = `You are a helpful AI assistant facilitating group conversation in a chat room. Focus on the shared room context and collaborative discussion.

Room: ${userEmail} | Message: ${message}

Room conversation history:
${roomContext}

User background (for reference):
${userContext}

${attachmentContext}

Instructions:
- Answer based primarily on the room's shared conversation and context
- Use the attachment content as additional context and reference material
- When users refer to "our discussion", "what we talked about", use room context
- Facilitate group discussion and build on shared topics
- Keep responses collaborative and inclusive
- Don't mention context headers, priorities, or system information
- Don't repeat or reference the conversation history format in your response
- Be natural and conversational

${aiInstructions ? `Additional instructions: ${aiInstructions}` : ''}`;
        break;
      case 'mixed':
        const priorityContext =
          contextPriority === 'user' ? userContext : roomContext;
        const secondaryContext =
          contextPriority === 'user' ? roomContext : userContext;

        systemMessage = `You are a helpful AI assistant in a chat room. Balance both personal and group context appropriately.

Room: ${userEmail} | Message: ${message}

Primary context (${contextPriority === 'user' ? 'Personal' : 'Room'}):
${priorityContext}

Secondary context (${contextPriority === 'user' ? 'Room' : 'Personal'}):
${secondaryContext}

${attachmentContext}

Instructions:
- Balance both personal and room context in your responses
- Use the attachment content as additional context and reference material
- Prioritize ${contextPriority === 'user' ? 'personal' : 'room'} context when there's ambiguity
- Be contextually aware of both individual and group dynamics
- Keep responses natural and appropriate to the conversation flow
- Don't mention context headers, priorities, or system information
- Don't repeat or reference the conversation history format in your response
- Be natural and conversational

${aiInstructions ? `Additional instructions: ${aiInstructions}` : ''}`;
        break;
    }

    messages.push({ role: 'system', content: systemMessage });
    messages.push({ role: 'user', content: message });

    return messages;
  }

  /**
   * Generate AI response for a user message in a specific room
   * Enhanced with multi-provider support and conversation history persistence
   *
   * IMPORTANT: Conversation history is stored by room ID, not by AI model.
   * This ensures that when users switch AI models/providers for a room,
   * the full conversation history is preserved and accessible to the new model.
   */
  async generateResponse(
    roomId: string,
    userId: string,
    userEmail: string,
    message: string,
    roomConfig: {
      ai_provider: AiProvider;
      ai_model: string;
      ai_instructions?: string;
      ai_temperature?: number;
      ai_max_tokens?: number;
      ai_top_p?: number;
      ai_frequency_penalty?: number;
      ai_presence_penalty?: number;
    },
  ): Promise<string> {
    try {
      // Phase 3: Update access timestamps and enforce limits
      this.updateAccessTimestamps(roomId, userId);
      await this.enforceMemoryLimits();

      // Get room and user memory - these are keyed by room ID only
      // This ensures conversation history persists across AI model changes
      const roomMemory = this.getRoomMemory(roomId);
      const userMemory = this.getUserMemory(roomId, userId);

      // Phase 2: Enhanced context combination with intelligence
      const { roomContext, userContext, contextPriority, conversationType } =
        await this.combineContexts(roomMemory, userMemory, message, userEmail);

      // Phase 3: Update analytics
      this.conversationTypeStats[conversationType]++;

      // Create AI provider - this can change without affecting memory
      const aiProvider = this.createAiProvider(roomConfig);

      // Log AI provider switch if different from previous
      this.logProviderSwitchIfNeeded(roomId, roomConfig);

      // Read AI config attachments for context
      const attachmentContext = await this.readAiConfigAttachments(roomId);

      // Create context-aware messages
      const messages = this.createContextAwareMessages(
        roomContext,
        userContext,
        contextPriority,
        conversationType,
        roomConfig.ai_instructions || '',
        attachmentContext,
        userEmail,
        message,
      );

      // Generate response using the appropriate provider
      // The provider gets access to full conversation history regardless of when it was created
      const response = await aiProvider.generateResponse(messages);

      // Save to memory based on conversation type
      // Memory is always saved to preserve history for future model switches
      if (
        conversationType === 'collaborative' ||
        conversationType === 'mixed'
      ) {
        await this.saveToRoomMemory(
          roomMemory,
          userEmail,
          message,
          response.content,
        );
      }

      // Always save to user memory to maintain personal context
      await this.saveToUserMemory(userMemory, message, response.content);

      return response.content;
    } catch (error) {
      this.logger.error(
        `Failed to generate AI response: ${error.message}`,
        error.stack,
      );
      return 'Sorry, I encountered an error while processing your message. Please try again.';
    }
  }

  /**
   * Log when AI provider/model changes for a room
   * This helps track model switches while maintaining conversation history
   */
  private logProviderSwitchIfNeeded(
    roomId: string,
    roomConfig: {
      ai_provider: AiProvider;
      ai_model: string;
    },
  ): void {
    // Store last used provider/model per room for comparison
    const lastConfigKey = `room_${roomId}_last_config`;
    const currentConfig = `${roomConfig.ai_provider}/${roomConfig.ai_model}`;

    // Simple in-memory storage for last config (could be enhanced with Redis/DB)
    if (!this.lastProviderConfigs) {
      this.lastProviderConfigs = new Map();
    }

    const lastConfig = this.lastProviderConfigs.get(lastConfigKey);

    if (lastConfig && lastConfig !== currentConfig) {
      this.logger.log(
        `🔄 AI provider switched for room ${roomId}: ${lastConfig} → ${currentConfig}. Conversation history preserved.`,
      );
    }

    this.lastProviderConfigs.set(lastConfigKey, currentConfig);
  }

  // Add private property to track provider configs
  private lastProviderConfigs: Map<string, string> = new Map();

  /**
   * Phase 1: Enhanced room memory saving for collaborative context
   * Save interactions to shared room memory with cleaner formatting
   */
  private async saveToRoomMemory(
    roomMemory: BufferMemory,
    userEmail: string,
    userMessage: string,
    aiResponse: string,
  ): Promise<void> {
    try {
      // Use cleaner formatting for room memory - avoid technical formatting
      const roomInput = `User ${userEmail} said: ${userMessage}`;
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
   * Save to user memory for personal context
   */
  private async saveToUserMemory(
    userMemory: BufferMemory,
    userMessage: string,
    aiResponse: string,
  ): Promise<void> {
    try {
      const cleanResponse = aiResponse
        .replace(/^(AI|Assistant):\s*/i, '')
        .trim();

      await userMemory.saveContext(
        { input: userMessage },
        { response: cleanResponse },
      );
    } catch (error) {
      this.logger.warn(`Failed to save to user memory: ${error.message}`);
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

    this.userMemories.delete(roomId);
    this.userLastAccess.delete(roomId);
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
   * Get available models for a specific provider
   */
  getAvailableModels(provider: AiProvider) {
    return AVAILABLE_MODELS[provider] || [];
  }

  /**
   * Get all available providers and their models
   */
  getAllAvailableModels() {
    return Object.values(AVAILABLE_MODELS)
      .flat()
      .filter((model) => model.enabled);
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
