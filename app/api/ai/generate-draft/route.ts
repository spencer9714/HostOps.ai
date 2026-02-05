import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGeminiClient } from '@/lib/ai/gemini';
import type { Message, KBDocument, WorkspaceSettings } from '@/types/database.types';

interface GenerateDraftRequest {
  thread_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateDraftRequest = await request.json();
    const { thread_id } = body;

    if (!thread_id) {
      return NextResponse.json(
        { error: 'Missing required field: thread_id' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch thread details
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('*, workspaces(*)')
      .eq('id', thread_id)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Fetch last N messages (e.g., 10)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', thread_id)
      .order('message_ts', { ascending: true })
      .limit(10);

    if (messagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: messagesError.message },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages found in thread' },
        { status: 400 }
      );
    }

    // Fetch workspace settings for escalation keywords
    const { data: settings } = await supabase
      .from('workspace_settings')
      .select('*')
      .eq('workspace_id', thread.workspace_id)
      .single();

    const escalationKeywords = settings?.escalation_keywords || [
      'refund',
      'compensation',
      'discount',
      'injury',
      'safety',
      'police',
      'legal',
      'lawsuit',
      'chargeback',
    ];

    // Fetch relevant KB documents
    const kbContext = await fetchRelevantKB(
      supabase,
      thread.workspace_id,
      thread.property_id,
      messages
    );

    // Prepare context for AI
    const geminiMessages = messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.body,
      timestamp: msg.message_ts,
    }));

    // Call Gemini to generate draft
    const geminiClient = getGeminiClient();
    const draft = await geminiClient.generateReply({
      messages: geminiMessages,
      kbContext,
      escalationKeywords,
    });

    // Save draft to database
    const { data: savedDraft, error: draftError } = await supabase
      .from('ai_drafts')
      .insert({
        thread_id,
        draft_text: draft.draft_text,
        confidence: draft.confidence,
        escalated: draft.escalated,
        escalation_reason: draft.escalation_reason,
        sources_used: draft.sources_used,
        model_used: 'gemini-pro',
        metadata: {
          message_count: messages.length,
          kb_chunks_used: kbContext.length,
        },
      })
      .select()
      .single();

    if (draftError || !savedDraft) {
      return NextResponse.json(
        { error: 'Failed to save draft', details: draftError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      draft: savedDraft,
    });
  } catch (error: any) {
    console.error('Generate draft error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Fetch relevant KB documents for context
 * Simple keyword-based retrieval for MVP (can be upgraded to embeddings later)
 */
async function fetchRelevantKB(
  supabase: any,
  workspaceId: string,
  propertyId: string | null,
  messages: Message[]
): Promise<string[]> {
  // Extract keywords from messages (simple approach)
  const lastMessage = messages[messages.length - 1];
  const keywords = extractKeywords(lastMessage.body);

  if (keywords.length === 0) {
    // No keywords, fetch generic workspace KB
    const { data: workspaceKB } = await supabase
      .from('kb_documents')
      .select('content')
      .eq('workspace_id', workspaceId)
      .eq('scope_type', 'workspace')
      .limit(3);

    return workspaceKB ? workspaceKB.map((doc: KBDocument) => doc.content) : [];
  }

  // Fetch KB documents matching keywords
  const kbResults: string[] = [];

  // Workspace-level KB
  const { data: workspaceKB } = await supabase
    .from('kb_documents')
    .select('content')
    .eq('workspace_id', workspaceId)
    .eq('scope_type', 'workspace')
    .textSearch('content', keywords.join(' | '), {
      type: 'websearch',
      config: 'english',
    })
    .limit(2);

  if (workspaceKB) {
    kbResults.push(...workspaceKB.map((doc: KBDocument) => doc.content));
  }

  // Property-level KB (if property specified)
  if (propertyId) {
    const { data: propertyKB } = await supabase
      .from('kb_documents')
      .select('content')
      .eq('workspace_id', workspaceId)
      .eq('scope_type', 'property')
      .eq('scope_id', propertyId)
      .textSearch('content', keywords.join(' | '), {
        type: 'websearch',
        config: 'english',
      })
      .limit(2);

    if (propertyKB) {
      kbResults.push(...propertyKB.map((doc: KBDocument) => doc.content));
    }
  }

  return kbResults;
}

/**
 * Extract keywords from text (simple implementation)
 * Can be improved with NLP or more sophisticated keyword extraction
 */
function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'can',
    'i',
    'you',
    'we',
    'they',
    'he',
    'she',
    'it',
    'this',
    'that',
    'these',
    'those',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !commonWords.has(word));

  // Return top 5 unique keywords
  return [...new Set(words)].slice(0, 5);
}
