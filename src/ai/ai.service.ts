import { PromptTemplate } from '@langchain/core/prompts';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGroq } from '@langchain/groq';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import { Client } from 'langsmith';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly llm: ChatGroq;
  private readonly roomMemories: Map<string, BufferMemory> = new Map();
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

    this.logger.log('AI service initialized with Groq and LangSmith');
  }

  /**
   * Get or create memory for a specific room
   */
  private getRoomMemory(roomId: string): BufferMemory {
    if (!this.roomMemories.has(roomId)) {
      const memory = new BufferMemory({
        memoryKey: 'chat_history',
        inputKey: 'input',
        outputKey: 'response',
      });
      this.roomMemories.set(roomId, memory);
      this.logger.log(`Created new memory for room: ${roomId}`);
    }
    return this.roomMemories.get(roomId);
  }

  /**
   * Generate AI response for a user message in a specific room
   */
  async generateResponse(
    roomId: string,
    userId: string,
    username: string,
    message: string,
  ): Promise<string> {
    try {
      const memory = this.getRoomMemory(roomId);

      // Create a context-aware prompt template
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

      // Create conversation chain with memory
      const chain = new ConversationChain({
        llm: this.llm,
        memory: memory,
        prompt: prompt,
      });

      // Generate response (LangSmith tracing enabled via environment variables)
      const response = await chain.predict({
        input: message,
        roomId: roomId,
        userId: userId,
        username: username,
      });

      this.logger.log(
        `Generated AI response for room ${roomId}, user ${username}`,
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
   * Clear memory for a specific room (useful for cleanup or reset)
   */
  clearRoomMemory(roomId: string): void {
    this.roomMemories.delete(roomId);
    this.logger.log(`Cleared memory for room: ${roomId}`);
  }

  /**
   * Get conversation history for a room
   */
  async getRoomHistory(roomId: string): Promise<string> {
    const memory = this.getRoomMemory(roomId);
    const history = await memory.loadMemoryVariables({});
    return history.chat_history || '';
  }
}
