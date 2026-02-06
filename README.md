# AriaHost MVP

A minimal viable product for a property management platform that proves the end-to-end flow: authentication → workspace creation → listing import.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Backend**: Supabase (Authentication + PostgreSQL)
- **Styling**: Tailwind CSS
- **Client**: @supabase/ssr + @supabase/supabase-js

## Features

1. User authentication (sign up / sign in)
2. Create and manage workspaces (property management companies)
3. Edit workspace names
4. Delete workspaces (cascades to all listings)
5. Import listings via manual form (simulated Airbnb import)
6. Edit listing details (Airbnb ID, title, description)
7. Delete individual listings
8. Multi-tenant data isolation via Row Level Security (RLS)

## Project Structure

```
AriaHost/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Workspace management & listings view
│   ├── import/
│   │   └── page.tsx          # Listing import form
│   ├── login/
│   │   └── page.tsx          # Authentication page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Root redirect to dashboard
├── lib/
│   └── supabase/
│       ├── client.ts         # Browser client
│       └── server.ts         # Server client
├── types/
│   └── database.types.ts     # TypeScript interfaces
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── middleware.ts             # Auth guard middleware
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd AriaHost
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration script: `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and anon key from Settings → API

### 4. Configure environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Tables

#### `profiles`
- `user_id` (UUID, PK, FK to auth.users)
- `full_name` (TEXT)
- `created_at` (TIMESTAMP)

#### `workspaces`
- `id` (UUID, PK)
- `name` (TEXT)
- `owner_user_id` (UUID, FK to auth.users)
- `created_at` (TIMESTAMP)

#### `listings`
- `id` (UUID, PK)
- `workspace_id` (UUID, FK to workspaces)
- `airbnb_id` (TEXT)
- `title` (TEXT)
- `description` (TEXT)
- `created_at` (TIMESTAMP)

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only see their own profiles
- Users can only see workspaces they own
- Users can only see listings in their own workspaces
- Multi-tenant isolation is enforced at the database level

## Code Examples

### Creating a Workspace

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const { data: { user } } = await supabase.auth.getUser();

const { data, error } = await supabase
  .from('workspaces')
  .insert({
    name: 'My Property Management Co',
    owner_user_id: user.id,
  })
  .select()
  .single();
```

### Creating a Listing

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const { error } = await supabase
  .from('listings')
  .insert({
    workspace_id: 'workspace-uuid',
    airbnb_id: '12345678',
    title: 'Beautiful Downtown Apartment',
    description: 'Cozy 2-bedroom apartment...',
  });
```

### Fetching Listings for a Workspace

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const { data, error } = await supabase
  .from('listings')
  .select('*')
  .eq('workspace_id', 'workspace-uuid')
  .order('created_at', { ascending: false });
```

### Updating a Workspace

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const { data, error } = await supabase
  .from('workspaces')
  .update({ name: 'New Workspace Name' })
  .eq('id', 'workspace-uuid')
  .select()
  .single();
```

### Updating a Listing

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const { data, error } = await supabase
  .from('listings')
  .update({
    airbnb_id: '87654321',
    title: 'Updated Title',
    description: 'Updated description...',
  })
  .eq('id', 'listing-uuid')
  .select()
  .single();
```

### Deleting a Workspace

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// This will cascade delete all listings in the workspace
const { error } = await supabase
  .from('workspaces')
  .delete()
  .eq('id', 'workspace-uuid');
```

### Deleting a Listing

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const { error } = await supabase
  .from('listings')
  .delete()
  .eq('id', 'listing-uuid');
```

### Auth Guard (Middleware)

The [middleware.ts](middleware.ts) file automatically:
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login` to `/dashboard`
- Refreshes auth tokens on each request

## Security Features

1. **Row Level Security**: All database queries are automatically filtered by user ownership
2. **Auth Middleware**: Protected routes require authentication
3. **No Server-Side Secrets**: All API calls use Supabase client-side auth
4. **Auto Profile Creation**: Profiles are created automatically on signup via database trigger

## User Flow

1. User signs up or signs in at `/login`
2. Redirected to `/dashboard`
3. User creates a workspace (property management company)
4. User can edit workspace name by clicking "Edit" button
5. User can delete workspace by clicking "Delete" button (with confirmation)
6. User clicks "Import Listing" → goes to `/import`
7. User fills form with Airbnb ID, title, description
8. Listing is saved to Supabase
9. User is redirected back to dashboard to see the listing
10. User can edit listing details by clicking "Edit" button on any listing
11. User can delete individual listings by clicking "Delete" button (with confirmation)

## Constraints & Simplifications

- No AI or automation features
- No background jobs or Edge Functions
- No Chrome extension (listing import is a simple form)
- No roles or complex permissions
- One workspace per user (UI supports multiple, but MVP focuses on one)
- No Airbnb API integration (simulated via manual form)

## Next Steps (Future)

- Add Chrome extension for real Airbnb scraping
- Implement AI-powered messaging automation
- Add background jobs for sync and monitoring
- Implement team roles and permissions
- Add analytics and reporting

## License

MIT
