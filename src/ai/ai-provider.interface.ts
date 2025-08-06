export enum AiProvider {
  OPENAI = 'openai',
  GEMINI = 'gemini',
  GROQ = 'groq',
}

export interface AiModel {
  id: string;
  name: string;
  provider: AiProvider;
  description?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsFunctionCalling?: boolean;
  supportsVision?: boolean;
  supportsStreaming?: boolean;
}

export interface AiProviderConfig {
  provider: AiProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface AiResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  provider: AiProvider;
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export abstract class BaseAiProvider {
  protected config: AiProviderConfig;

  constructor(config: AiProviderConfig) {
    this.config = config;
  }

  abstract generateResponse(
    messages: AiChatMessage[],
    options?: Partial<AiProviderConfig>,
  ): Promise<AiResponse>;

  abstract streamResponse(
    messages: AiChatMessage[],
    options?: Partial<AiProviderConfig>,
  ): AsyncIterableIterator<string>;

  abstract validateConfig(): boolean;

  abstract getAvailableModels(): AiModel[];
}

export const AVAILABLE_MODELS: Record<AiProvider, AiModel[]> = {
  [AiProvider.OPENAI]: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: AiProvider.OPENAI,
      description: 'Most capable GPT-4 model with vision capabilities',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      supportsFunctionCalling: true,
      supportsVision: true,
      supportsStreaming: true,
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: AiProvider.OPENAI,
      description: 'Faster and cheaper GPT-4o model',
      contextWindow: 128000,
      maxOutputTokens: 16384,
      supportsFunctionCalling: true,
      supportsVision: true,
      supportsStreaming: true,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: AiProvider.OPENAI,
      description: 'Fast and efficient model for most tasks',
      contextWindow: 16385,
      maxOutputTokens: 4096,
      supportsFunctionCalling: true,
      supportsVision: false,
      supportsStreaming: true,
    },
    {
      id: 'o1-preview',
      name: 'o1 Preview',
      provider: AiProvider.OPENAI,
      description: 'Advanced reasoning model for complex problems',
      contextWindow: 128000,
      maxOutputTokens: 32768,
      supportsFunctionCalling: false,
      supportsVision: false,
      supportsStreaming: false,
    },
    {
      id: 'o1-mini',
      name: 'o1 Mini',
      provider: AiProvider.OPENAI,
      description: 'Faster reasoning model for coding and math',
      contextWindow: 128000,
      maxOutputTokens: 65536,
      supportsFunctionCalling: false,
      supportsVision: false,
      supportsStreaming: false,
    },
  ],
  [AiProvider.GEMINI]: [
    {
      id: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash (Experimental)',
      provider: AiProvider.GEMINI,
      description: 'Latest Gemini model with multimodal capabilities',
      contextWindow: 1048576,
      maxOutputTokens: 8192,
      supportsFunctionCalling: true,
      supportsVision: true,
      supportsStreaming: true,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: AiProvider.GEMINI,
      description: 'Most capable Gemini model with large context window',
      contextWindow: 2097152,
      maxOutputTokens: 8192,
      supportsFunctionCalling: true,
      supportsVision: true,
      supportsStreaming: true,
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: AiProvider.GEMINI,
      description: 'Fast and efficient Gemini model',
      contextWindow: 1048576,
      maxOutputTokens: 8192,
      supportsFunctionCalling: true,
      supportsVision: true,
      supportsStreaming: true,
    },
  ],
  [AiProvider.GROQ]: [
    {
      id: 'llama3-70b-8192',
      name: 'Llama 3 70B',
      provider: AiProvider.GROQ,
      description: 'Large Llama 3 model with high performance',
      contextWindow: 8192,
      maxOutputTokens: 8192,
      supportsFunctionCalling: true,
      supportsVision: false,
      supportsStreaming: true,
    },
    {
      id: 'llama3-8b-8192',
      name: 'Llama 3 8B',
      provider: AiProvider.GROQ,
      description: 'Smaller Llama 3 model for faster responses',
      contextWindow: 8192,
      maxOutputTokens: 8192,
      supportsFunctionCalling: true,
      supportsVision: false,
      supportsStreaming: true,
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B',
      provider: AiProvider.GROQ,
      description: 'Mixture of experts model with large context',
      contextWindow: 32768,
      maxOutputTokens: 32768,
      supportsFunctionCalling: true,
      supportsVision: false,
      supportsStreaming: true,
    },
    {
      id: 'gemma2-9b-it',
      name: 'Gemma 2 9B IT',
      provider: AiProvider.GROQ,
      description: "Google's Gemma 2 model optimized for instruction following",
      contextWindow: 8192,
      maxOutputTokens: 8192,
      supportsFunctionCalling: false,
      supportsVision: false,
      supportsStreaming: true,
    },
  ],
};
