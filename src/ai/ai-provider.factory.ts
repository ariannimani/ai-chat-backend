import {
  AiProvider,
  AiProviderConfig,
  BaseAiProvider,
} from './ai-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { OpenAiProvider } from './providers/openai.provider';

export class AiProviderFactory {
  static createProvider(config: AiProviderConfig): BaseAiProvider {
    switch (config.provider) {
      case AiProvider.OPENAI:
        return new OpenAiProvider(config);
      case AiProvider.GEMINI:
        return new GeminiProvider(config);
      case AiProvider.GROQ:
        return new GroqProvider(config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  static getDefaultConfig(provider: AiProvider): Partial<AiProviderConfig> {
    switch (provider) {
      case AiProvider.OPENAI:
        return {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 1000,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0,
        };
      case AiProvider.GEMINI:
        return {
          model: 'gemini-1.5-flash',
          temperature: 0.7,
          maxTokens: 1000,
          topP: 1.0,
        };
      case AiProvider.GROQ:
        return {
          model: 'llama3-70b-8192',
          temperature: 0.7,
          maxTokens: 1000,
        };
      default:
        return {};
    }
  }
}
