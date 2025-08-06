import { GoogleGenAI } from '@google/genai';
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
  private client: GoogleGenAI;

  constructor(config: AiProviderConfig) {
    super(config);
    this.client = new GoogleGenAI({
      apiKey: config.apiKey,
    });
  }

  async generateResponse(
    messages: AiChatMessage[],
    options?: Partial<AiProviderConfig>,
  ): Promise<AiResponse> {
    const mergedConfig = { ...this.config, ...options };

    // Convert messages to Gemini format
    const contents = this.convertMessagesToGeminiFormat(messages);

    const response = await this.client.models.generateContent({
      model: mergedConfig.model,
      contents,
      config: {
        temperature: mergedConfig.temperature,
        maxOutputTokens: mergedConfig.maxTokens,
        topP: mergedConfig.topP,
      },
    });

    return {
      content: response.text || '',
      usage: response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount || 0,
            completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
      model: mergedConfig.model,
      provider: AiProvider.GEMINI,
    };
  }

  async *streamResponse(
    messages: AiChatMessage[],
    options?: Partial<AiProviderConfig>,
  ): AsyncIterableIterator<string> {
    const mergedConfig = { ...this.config, ...options };

    // Convert messages to Gemini format
    const contents = this.convertMessagesToGeminiFormat(messages);

    const stream = await this.client.models.generateContentStream({
      model: mergedConfig.model,
      contents,
      config: {
        temperature: mergedConfig.temperature,
        maxOutputTokens: mergedConfig.maxTokens,
        topP: mergedConfig.topP,
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }

  private convertMessagesToGeminiFormat(messages: AiChatMessage[]): any {
    // Gemini expects a different format - combine system message with first user message
    // and convert to Gemini's content format
    const systemMessage = messages.find((msg) => msg.role === 'system');
    const nonSystemMessages = messages.filter((msg) => msg.role !== 'system');

    if (nonSystemMessages.length === 0) {
      return 'Hello';
    }

    // If there's a system message, prepend it to the first user message
    if (systemMessage && nonSystemMessages[0]?.role === 'user') {
      nonSystemMessages[0].content = `${systemMessage.content}\n\n${nonSystemMessages[0].content}`;
    }

    // Convert to Gemini format - for simple case, just return the latest user message
    const lastUserMessage = nonSystemMessages
      .filter((msg) => msg.role === 'user')
      .pop();

    return lastUserMessage?.content || 'Hello';
  }

  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.model);
  }

  getAvailableModels(): AiModel[] {
    return AVAILABLE_MODELS[AiProvider.GEMINI];
  }
}
