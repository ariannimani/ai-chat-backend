import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  AiChatMessage,
  AiModel,
  AiProvider,
  AiProviderConfig,
  AiResponse,
  AVAILABLE_MODELS,
  BaseAiProvider,
} from '../ai-provider.interface';

export class GeminiProvider extends BaseAiProvider {
  private client: ChatGoogleGenerativeAI;

  constructor(config: AiProviderConfig) {
    super(config);
    this.client = new ChatGoogleGenerativeAI({
      apiKey: config.apiKey,
      model: config.model,
      temperature: Number(config.temperature) || 0.7,
      maxOutputTokens: Number(config.maxTokens) || 1000,
      topP: Number(config.topP) || 1.0,
    });
  }

  async generateResponse(
    messages: AiChatMessage[],
    options?: Partial<AiProviderConfig>,
  ): Promise<AiResponse> {
    const mergedConfig = { ...this.config, ...options };

    // Update client if config changed - ensure numeric values
    if (options) {
      this.client = new ChatGoogleGenerativeAI({
        apiKey: mergedConfig.apiKey,
        model: mergedConfig.model,
        temperature: Number(mergedConfig.temperature) || 0.7,
        maxOutputTokens: Number(mergedConfig.maxTokens) || 1000,
        topP: Number(mergedConfig.topP) || 1.0,
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
      provider: AiProvider.GEMINI,
    };
  }

  async *streamResponse(
    messages: AiChatMessage[],
    options?: Partial<AiProviderConfig>,
  ): AsyncIterableIterator<string> {
    const mergedConfig = { ...this.config, ...options };

    // Update client if config changed
    if (options) {
      this.client = new ChatGoogleGenerativeAI({
        apiKey: mergedConfig.apiKey,
        model: mergedConfig.model,
        temperature: Number(mergedConfig.temperature) || 0.7,
        maxOutputTokens: Number(mergedConfig.maxTokens) || 1000,
        topP: Number(mergedConfig.topP) || 1.0,
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
    return AVAILABLE_MODELS[AiProvider.GEMINI];
  }
}
