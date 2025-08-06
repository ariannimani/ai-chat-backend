import OpenAI from 'openai';
import {
  AiChatMessage,
  AiModel,
  AiProvider,
  AiProviderConfig,
  AiResponse,
  AVAILABLE_MODELS,
  BaseAiProvider,
} from '../ai-provider.interface';

export class OpenAiProvider extends BaseAiProvider {
  private client: OpenAI;

  constructor(config: AiProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  async generateResponse(
    messages: AiChatMessage[],
    options?: Partial<AiProviderConfig>,
  ): Promise<AiResponse> {
    const mergedConfig = { ...this.config, ...options };

    const response = await this.client.chat.completions.create({
      model: mergedConfig.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: mergedConfig.temperature,
      max_tokens: mergedConfig.maxTokens,
      top_p: mergedConfig.topP,
      frequency_penalty: mergedConfig.frequencyPenalty,
      presence_penalty: mergedConfig.presencePenalty,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      model: response.model,
      provider: AiProvider.OPENAI,
    };
  }

  async *streamResponse(
    messages: AiChatMessage[],
    options?: Partial<AiProviderConfig>,
  ): AsyncIterableIterator<string> {
    const mergedConfig = { ...this.config, ...options };

    const stream = await this.client.chat.completions.create({
      model: mergedConfig.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: mergedConfig.temperature,
      max_tokens: mergedConfig.maxTokens,
      top_p: mergedConfig.topP,
      frequency_penalty: mergedConfig.frequencyPenalty,
      presence_penalty: mergedConfig.presencePenalty,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.model);
  }

  getAvailableModels(): AiModel[] {
    return AVAILABLE_MODELS[AiProvider.OPENAI];
  }
}
