export interface AIProvider {
  name: string;
  generateResponse(prompt: string, context?: AIContext): Promise<string>;
}

export interface AIContext {
  prospectName: string;
  prospectEmail: string;
  message: string;
  isReturningProspect: boolean;
  previousConversations?: ConversationSummary[];
  companyInfo: CompanyInfo;
}

export interface ConversationSummary {
  date: string;
  topic: string;
  summary: string;
}

export interface CompanyInfo {
  name: string;
  description: string;
  services: string[];
  values: string[];
  tone: 'formal' | 'friendly' | 'professional' | 'casual';
}

export enum AIProviderType {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
}

export interface AIResponse {
  content: string;
  provider: AIProviderType;
  tokens?: number;
  processingTime: number;
}
