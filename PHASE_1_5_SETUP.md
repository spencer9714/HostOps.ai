# Phase 1.5 Setup Guide - AI Reply System with RAG

## Overview

Phase 1.5 adds an AI-powered reply assistant with knowledge base (RAG), inbox management, and draft generation using Google Gemini.

**Key Features:**
- Knowledge Base with workspace and property-level scopes
- Email forwarding via inbound webhook
- Manual thread/message creation
- AI draft generation with escalation detection
- No auto-sending - drafts are copy/paste only

## 1. Database Migration

Run the Phase 1.5 migration in Supabase SQL Editor:

```sql
-- Location: supabase/migrations/002_phase1_5_ai_rag_inbox.sql
```

This creates:
- `kb_documents` - Knowledge base documents
- `kb_chunks` - Chunked content for RAG
- `threads` - Conversation threads
- `messages` - Individual messages
- `ai_drafts` - Generated reply drafts
- `workspace_settings` - Escalation rules

All tables have RLS policies enforcing workspace ownership.

## 2. Environment Variables

Add to your `.env.local`:

```env
# Existing Supabase vars
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# New: Gemini API (optional for MVP - stub is included)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-pro
```

### Getting Gemini API Key (Optional)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env.local`

**Note:** The Gemini client includes a mock implementation. You can test without a real API key.

## 3. SendGrid Inbound Parse Setup

### Overview

Inbound Parse allows users to forward guest emails to a unique address:
```
inbound+{workspace_id}@ariahost.ai
```

The email is POSTed to your webhook endpoint, which creates a thread and message.

### Configuration Steps

#### 3.1. Domain Setup

1. **Add MX Record** (via your DNS provider):
   ```
   Type: MX
   Name: inbound (or subdomain of your choice)
   Value: mx.sendgrid.net
   Priority: 10
   ```

2. **Verify Domain in SendGrid**:
   - Go to SendGrid → Settings → Sender Authentication
   - Add your domain
   - Follow DNS verification steps

#### 3.2. Configure Inbound Parse

1. Go to **SendGrid → Settings → Inbound Parse**

2. Click **Add Host & URL**

3. Configure:
   - **Subdomain**: `inbound` (matches your MX record)
   - **Domain**: `hostops.ai` (your domain)
   - **Destination URL**: `https://yourdomain.com/api/email/inbound`
   - **Check** "POST the raw, full MIME message"
   - **Check** "Send Raw" if you want full email data

4. **Save**

#### 3.3. Testing

Test locally with ngrok:

```bash
# Start your dev server
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Update SendGrid Inbound Parse URL to:
# https://your-ngrok-url.ngrok.io/api/email/inbound
```

Send a test email to:
```
inbound+{workspace_id}@ariahost.ai
```

Check your Supabase `threads` and `messages` tables.

#### 3.4. Production Deployment

For production, ensure your API route is publicly accessible:
```
https://hostops.ai/api/email/inbound
```

**Security Note:** The endpoint is public but validates workspace_id exists.

### Alternative: Mailgun, Postmark, etc.

Similar setup for other providers:

**Mailgun:**
- Configure Route → Forward to webhook
- Parse multipart/form-data payload

**Postmark:**
- Configure Inbound Webhook
- Parse JSON payload

The core logic in `/api/email/inbound/route.ts` can be adapted.

## 4. Application Structure

### New Routes

```
/knowledge          - Knowledge base management (CRUD KB documents)
/inbox              - Thread list + create manual threads
/inbox/[id]         - Thread detail + AI draft generation
/settings           - Escalation keywords configuration

API Routes:
/api/email/inbound        - Receives forwarded emails (POST)
/api/ai/generate-draft    - Generates AI reply drafts (POST)
```

### Navigation

Update your main dashboard navigation to include links to:
- Dashboard (existing)
- Inbox (new)
- Knowledge Base (new)
- Settings (new)

## 5. User Workflows

### 5.1. Knowledge Base Setup

1. Go to `/knowledge`
2. Select workspace
3. Add documents:
   - **Workspace scope**: Shared info (WiFi, house rules, policies)
   - **Property scope**: Property-specific info (parking, access codes)
4. Documents are used as context for AI draft generation

### 5.2. Manual Thread Creation

1. Go to `/inbox`
2. Click "New Thread"
3. Fill in:
   - Subject
   - Guest email
   - Guest name (optional)
   - Property (optional)
   - Initial message (optional)
4. Add more messages via thread detail page

### 5.3. Email Forwarding

1. Go to `/inbox`
2. Copy the inbound email address: `inbound+{workspace_id}@ariahost.ai`
3. Forward guest emails to this address
4. Thread is created automatically
5. View in `/inbox`

### 5.4. AI Draft Generation

1. Open a thread: `/inbox/{thread_id}`
2. Review conversation messages
3. Click "Generate Draft Reply"
4. AI analyzes:
   - Conversation history
   - Relevant KB documents
   - Escalation keywords
5. Draft appears in sidebar with:
   - Draft text
   - Confidence score
   - Escalation warning (if applicable)
6. Click "Copy to Clipboard"
7. Paste into Airbnb (or wherever you send replies)

### 5.5. Escalation Handling

If a message contains escalation keywords:
- Draft is still generated
- Red warning banner appears
- Escalation reason is shown
- Review and modify draft manually before sending

Configure escalation keywords in `/settings`.

## 6. RAG (Retrieval Augmented Generation)

### How It Works

1. **Knowledge Base**:
   - Documents are stored in `kb_documents`
   - Optionally chunked into `kb_chunks`

2. **Retrieval** (simple keyword matching for MVP):
   - Extract keywords from guest message
   - Full-text search in KB documents
   - Retrieve top matching documents
   - Provide as context to Gemini

3. **Generation**:
   - Gemini receives:
     - Conversation history
     - Relevant KB context
     - Escalation keywords
   - Generates draft reply

### Upgrading to Embeddings (Future)

For better semantic search:

1. **Enable pgvector** in Supabase:
   ```sql
   CREATE EXTENSION vector;
   ALTER TABLE kb_chunks ADD COLUMN embedding vector(1536);
   ```

2. **Generate embeddings**:
   - Use OpenAI embeddings API
   - Or use Gemini embeddings
   - Store in `kb_chunks.embedding`

3. **Update retrieval**:
   - Replace keyword search with vector similarity
   - Use cosine similarity for ranking

## 7. Testing Checklist

- [ ] Run Phase 1.5 migration
- [ ] Create a KB document (workspace scope)
- [ ] Create a KB document (property scope)
- [ ] Create a manual thread
- [ ] Add guest message manually
- [ ] Generate AI draft (mock mode)
- [ ] Test escalation keyword detection
- [ ] Update escalation keywords in settings
- [ ] Test email forwarding (if SendGrid configured)
- [ ] Copy draft to clipboard
- [ ] Test with real Gemini API key (optional)

## 8. Troubleshooting

### Issue: Email not creating thread

**Check:**
1. SendGrid Inbound Parse is configured correctly
2. Webhook URL is publicly accessible
3. Check SendGrid Event Webhook logs
4. Check your API logs (`console.error` in `/api/email/inbound`)

**Debug:**
```bash
# Check Supabase logs
# Go to Supabase Dashboard → Logs → API

# Check Next.js logs
# Terminal where `npm run dev` is running
```

### Issue: AI draft generation fails

**Check:**
1. Thread has at least one message
2. Check API logs in browser DevTools → Network
3. Check response from `/api/ai/generate-draft`

**Common causes:**
- No messages in thread
- Thread not found
- Supabase RLS blocking query

### Issue: KB not appearing in drafts

**Check:**
1. KB documents exist for the workspace
2. Property is set correctly (if using property scope)
3. Keywords extracted from message match KB content

**Note:** Simple keyword matching is basic. Upgrade to embeddings for better results.

## 9. Next Steps (Future Enhancements)

- [ ] Implement real Gemini API call (replace mock)
- [ ] Add embedding support for better RAG
- [ ] Add chunking logic for large KB documents
- [ ] Implement draft history/versioning
- [ ] Add draft editing UI
- [ ] Implement draft approval workflow
- [ ] Add analytics (draft acceptance rate, escalation rate)
- [ ] Multi-language support

## 10. Security Notes

- All tables use RLS enforcing workspace ownership
- Inbound email endpoint validates workspace exists
- No authentication on webhook (SendGrid IPs can be whitelisted)
- Drafts never auto-send - manual copy/paste only
- Escalation keywords prevent accidental AI responses

## Support

For issues or questions:
- Check `/help` command
- Review Supabase logs
- Check Next.js console output
- Review this documentation

---

**Phase 1.5 Complete!** 🎉

You now have a compliant AI reply system that:
- ✅ Never auto-sends messages
- ✅ Supports manual and email ingestion
- ✅ Uses RAG for context-aware replies
- ✅ Detects sensitive content for escalation
- ✅ Generates copy-paste draft replies
