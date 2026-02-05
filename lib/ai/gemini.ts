import type { GenerateDraftOutput } from '@/types/database.types';

/**
 * Gemini AI Client Wrapper
 * For MVP: Can be a stub that returns mock data
 * For production: Integrate with Google Gemini API
 */

interface GeminiMessage {
  role: 'guest' | 'host';
  content: string;
  timestamp: string;
}

interface GeminiContext {
  messages: GeminiMessage[];
  kbContext: string[];
  propertyInfo?: {
    title: string;
    description: string;
  };
  escalationKeywords: string[];
}

export class GeminiClient {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = process.env.GEMINI_MODEL || 'gemini-pro';
  }

  async generateReply(context: GeminiContext): Promise<GenerateDraftOutput> {
    // For MVP: Return mock data
    // TODO: Implement actual Gemini API call
    return this.mockGenerateReply(context);
  }

  private async mockGenerateReply(context: GeminiContext): Promise<GenerateDraftOutput> {
    const lastMessage = context.messages[context.messages.length - 1];

    // Check for escalation keywords
    const escalated = this.checkEscalation(lastMessage.content, context.escalationKeywords);

    // Simple mock response
    const draftText = escalated
      ? "Thank you for reaching out. I understand your concern and want to ensure this is handled properly. A member of our team will review this personally and get back to you within 24 hours."
      : `Thank you for your message. ${context.kbContext.length > 0 ? 'Based on our property information: ' : ''}I'd be happy to help you with that. Let me know if you need any additional information.`;

    return {
      draft_text: draftText,
      confidence: escalated ? 0.5 : 0.85,
      escalated,
      escalation_reason: escalated ? 'Contains sensitive keywords requiring manual review' : null,
      sources_used: context.kbContext.length > 0 ? ['kb-mock-id'] : [],
    };
  }

  /**
   * Actual Gemini API implementation (stub for reference)
   * Uncomment and implement when ready to use real Gemini API
   */
  // private async callGeminiAPI(context: GeminiContext): Promise<GenerateDraftOutput> {
  //   const { GoogleGenerativeAI } = require('@google/generative-ai');
  //   const genAI = new GoogleGenerativeAI(this.apiKey);
  //   const model = genAI.getGenerativeModel({ model: this.model });
  //
  //   const prompt = this.buildPrompt(context);
  //   const result = await model.generateContent(prompt);
  //   const response = await result.response;
  //   const text = response.text();
  //
  //   const escalated = this.checkEscalation(context.messages[context.messages.length - 1].content, context.escalationKeywords);
  //
  //   return {
  //     draft_text: text,
  //     confidence: 0.9,
  //     escalated,
  //     escalation_reason: escalated ? 'Contains sensitive keywords' : null,
  //     sources_used: context.kbContext.length > 0 ? ['kb-doc-ids'] : [],
  //   };
  // }

  private buildPrompt(context: GeminiContext): string {
    let prompt = 'You are a helpful property management assistant. Generate a professional reply to the guest message.\n\n';

    if (context.kbContext.length > 0) {
      prompt += 'Relevant property information:\n';
      context.kbContext.forEach((kb, i) => {
        prompt += `${i + 1}. ${kb}\n`;
      });
      prompt += '\n';
    }

    prompt += 'Conversation history:\n';
    context.messages.forEach((msg) => {
      prompt += `${msg.role === 'guest' ? 'Guest' : 'Host'}: ${msg.content}\n`;
    });

    prompt += '\nGenerate a professional, helpful reply to the most recent guest message. Be concise and friendly.';

    return prompt;
  }

  private checkEscalation(messageText: string, keywords: string[]): boolean {
    const lowerText = messageText.toLowerCase();
    return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));
  }
}

// Singleton instance
let geminiClient: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!geminiClient) {
    geminiClient = new GeminiClient();
  }
  return geminiClient;
}
