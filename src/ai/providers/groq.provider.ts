import { ChatGroq } from '@langchain/groq';
import {
  AiChatMessage,
  AiModel,
  AiProvider,
  AiProviderConfig,
  AiResponse,
  AVAILABLE_MODELS,
  BaseAiProvider,
} from '../ai-provider.interface';

export class GroqProvider extends BaseAiProvider {
  private client: ChatGroq;

  constructor(config: AiProviderConfig) {
    super(config);
    this.client = new ChatGroq({
      model: config.model,
      apiKey: config.apiKey,
      temperature: Number(config.temperature) || 0.7,
      maxTokens: Number(config.maxTokens) || 1000,
    });
  }

  async generateResponse(
    messages: AiChatMessage[],
    options?: Partial<AiProviderConfig>,
  ): Promise<AiResponse> {
    const mergedConfig = { ...this.config, ...options };

    // Update client if config changed - ensure numeric values
    if (options) {
      this.client = new ChatGroq({
        model: mergedConfig.model,
        apiKey: mergedConfig.apiKey,
        temperature: Number(mergedConfig.temperature) || 0.7,
        maxTokens: Number(mergedConfig.maxTokens) || 1000,
      });
    }

    // Convert to LangChain format
    const langChainMessages = messages.map((msg) => {
      switch (msg.role) {
        case 'system':
          return { role: 'system', content: msg.content };
        case 'user':
          return { role: 'human', content: msg.content };
        case 'assistant':
          return { role: 'assistant', content: msg.content };
        default:
          return { role: 'human', content: msg.content };
      }
    });

    const response = await this.client.invoke(langChainMessages);

    return {
      content: response.content as string,
      usage: {
        promptTokens: 0, // LangChain doesn't provide detailed usage
        completionTokens: 0,
        totalTokens: 0,
      },
      model: mergedConfig.model,
      provider: AiProvider.GROQ,
    };
  }

  async *streamResponse(
    messages: AiChatMessage[],
    options?: Partial<AiProviderConfig>,
  ): AsyncIterableIterator<string> {
    const mergedConfig = { ...this.config, ...options };

    // Update client if config changed
    if (options) {
      this.client = new ChatGroq({
        model: mergedConfig.model,
        apiKey: mergedConfig.apiKey,
        temperature: mergedConfig.temperature || 0.7,
        maxTokens: mergedConfig.maxTokens || 1000,
      });
    }

    // Convert to LangChain format
    const langChainMessages = messages.map((msg) => {
      switch (msg.role) {
        case 'system':
          return { role: 'system', content: msg.content };
        case 'user':
          return { role: 'human', content: msg.content };
        case 'assistant':
          return { role: 'assistant', content: msg.content };
        default:
          return { role: 'human', content: msg.content };
      }
    });

    const stream = await this.client.stream(langChainMessages);

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  }

  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.model);
  }

  getAvailableModels(): AiModel[] {
    return AVAILABLE_MODELS[AiProvider.GROQ];
  }
}
