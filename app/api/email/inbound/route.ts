import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Inbound Email Webhook Handler
 *
 * Receives POSTed email payloads from SendGrid Inbound Parse (or similar service)
 * Email format: inbound+{workspace_id}@hostops.ai
 *
 * Expected payload (SendGrid Inbound Parse format):
 * - to: recipient email (e.g., inbound+uuid@hostops.ai)
 * - from: sender email
 * - subject: email subject
 * - text: plain text body
 * - html: html body (optional)
 * - headers: JSON string of email headers
 */

interface InboundEmailPayload {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
  headers?: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data (SendGrid sends multipart/form-data)
    const formData = await request.formData();

    const payload: InboundEmailPayload = {
      to: formData.get('to') as string,
      from: formData.get('from') as string,
      subject: formData.get('subject') as string,
      text: formData.get('text') as string,
      html: formData.get('html') as string | undefined,
      headers: formData.get('headers') as string | undefined,
    };

    // Validate required fields
    if (!payload.to || !payload.from || !payload.text) {
      return NextResponse.json(
        { error: 'Missing required fields: to, from, text' },
        { status: 400 }
      );
    }

    // Extract workspace_id from email address
    // Format: inbound+{workspace_id}@hostops.ai
    const workspaceId = extractWorkspaceId(payload.to);
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Invalid recipient email format. Expected: inbound+{workspace_id}@hostops.ai' },
        { status: 400 }
      );
    }

    // Extract guest info
    const guestEmail = extractEmail(payload.from);
    const guestName = extractName(payload.from);

    // Create Supabase client
    const supabase = await createClient();

    // Verify workspace exists
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Find or create thread
    // Match by guest_email + subject (or create new)
    const { data: existingThread } = await supabase
      .from('threads')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('guest_email', guestEmail)
      .eq('subject', payload.subject)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let threadId: string;

    if (existingThread) {
      // Use existing thread
      threadId = existingThread.id;

      // Update thread timestamp
      await supabase
        .from('threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', threadId);
    } else {
      // Create new thread
      const { data: newThread, error: threadError } = await supabase
        .from('threads')
        .insert({
          workspace_id: workspaceId,
          source: 'email',
          subject: payload.subject,
          guest_email: guestEmail,
          guest_name: guestName,
          status: 'active',
          metadata: {
            headers: payload.headers ? JSON.parse(payload.headers) : {},
          },
        })
        .select()
        .single();

      if (threadError || !newThread) {
        return NextResponse.json(
          { error: 'Failed to create thread', details: threadError?.message },
          { status: 500 }
        );
      }

      threadId = newThread.id;
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        role: 'guest',
        body: payload.text,
        source: 'email',
        metadata: {
          from: payload.from,
          subject: payload.subject,
          html: payload.html,
          raw_payload: payload,
        },
      })
      .select()
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Failed to create message', details: messageError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      thread_id: threadId,
      message_id: message.id,
    });
  } catch (error: any) {
    console.error('Inbound email error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Extract workspace_id from recipient email
 * Format: inbound+{workspace_id}@hostops.ai
 */
function extractWorkspaceId(email: string): string | null {
  const match = email.match(/inbound\+([a-f0-9-]+)@/i);
  return match ? match[1] : null;
}

/**
 * Extract email address from "Name <email@example.com>" format
 */
function extractEmail(from: string): string {
  const match = from.match(/<(.+?)>/);
  return match ? match[1] : from;
}

/**
 * Extract name from "Name <email@example.com>" format
 */
function extractName(from: string): string | null {
  const match = from.match(/^(.+?)\s*</);
  return match ? match[1].trim() : null;
}
