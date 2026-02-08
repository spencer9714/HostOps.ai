# Deploy AriaHost to Vercel

## Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Supabase project set up
- Your code pushed to GitHub

## Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - AriaHost"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ariahost.git
git branch -M main
git push -u origin main
```

## Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your **ariahost** repository
5. Click **"Import"**

## Step 3: Configure Project Settings

### Framework Preset
- Vercel should auto-detect **Next.js**
- If not, select **Next.js** from the dropdown

### Root Directory
- Leave as `.` (root)

### Build Settings
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

## Step 4: Add Environment Variables

Click **"Environment Variables"** and add these:

| Name | Value | Where to Find |
|------|-------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase → Settings → API |
| `GEMINI_API_KEY` | `AIzaSy...` | Google AI Studio (optional) |
| `GEMINI_MODEL` | `gemini-pro` | Optional, defaults to gemini-pro |

**Important:**
- Copy these from your `.env.local` file
- Make sure to use the **ANON** key, not the service role key
- Click **"Add"** after each variable

## Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Step 6: Update Supabase URL Configuration

After deployment, update Supabase to allow your Vercel domain:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Site URL**: `https://your-project.vercel.app`
3. Add to **Redirect URLs**:
   - `https://your-project.vercel.app/**`
   - `https://your-project.vercel.app/auth/callback`

## Step 7: Custom Domain (Optional)

### Add Custom Domain

1. In Vercel project settings, go to **"Domains"**
2. Click **"Add"**
3. Enter your domain: `ariahost.ai`
4. Follow DNS instructions to point your domain to Vercel

### Update DNS for Email (SendGrid)

If using SendGrid for email inbound (Phase 1.5):

1. Add **MX Record**:
   ```
   Type: MX
   Name: inbound
   Value: mx.sendgrid.net
   Priority: 10
   ```

2. Configure SendGrid Inbound Parse:
   - **Domain**: `ariahost.ai` (your domain)
   - **Subdomain**: `inbound`
   - **Destination URL**: `https://ariahost.ai/api/email/inbound`

3. Update Supabase URLs to use your custom domain:
   - Site URL: `https://ariahost.ai`
   - Redirect URLs: `https://ariahost.ai/**`

## Step 8: Run Database Migrations

If you haven't run migrations yet:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/migrations/002_phase1_5_ai_rag_inbox.sql`
4. Run `supabase/migrations/003_add_listing_photos.sql`

## Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Make sure all dependencies are in package.json
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

**Error: "Build exceeded maximum duration"**
- Check for infinite loops in your code
- Ensure no large files are in the repository

### Authentication Not Working

1. Check environment variables are set correctly
2. Verify Supabase URL configuration includes Vercel domain
3. Check browser console for errors

### Email Inbound Not Working

1. Verify DNS records are propagated (use [dnschecker.org](https://dnschecker.org))
2. Check SendGrid webhook URL matches your Vercel domain
3. Test with ngrok locally first before deploying

### Database Connection Issues

1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check RLS policies are enabled on all tables
3. Ensure user is authenticated before accessing data

## Vercel CLI Deployment (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GEMINI_API_KEY
```

## Continuous Deployment

Once connected to GitHub:
- Every push to `main` branch auto-deploys to production
- Pull requests create preview deployments
- View deployment logs in Vercel dashboard

## Production Checklist

- [ ] Environment variables added to Vercel
- [ ] Supabase URL configuration updated
- [ ] Database migrations run
- [ ] Custom domain configured (if using)
- [ ] SendGrid DNS records added (if using email)
- [ ] Test signup/login flow
- [ ] Test workspace creation
- [ ] Test property import
- [ ] Test knowledge base (if Phase 1.5)
- [ ] Test email inbound (if Phase 1.5)

## Monitoring

### View Logs
1. Go to Vercel Dashboard → Your Project
2. Click **"Deployments"**
3. Click on a deployment → **"Logs"**

### Analytics
- Vercel automatically provides:
  - Page views
  - Load times
  - Error rates
- View in **"Analytics"** tab

## Updating the App

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Vercel auto-deploys in ~2 minutes
```

## Cost

- **Vercel Free Tier**: Sufficient for development/testing
  - Unlimited deployments
  - 100 GB bandwidth/month
  - Automatic HTTPS
  - Custom domains

- **Supabase Free Tier**: Sufficient for MVP
  - 500 MB database
  - 50,000 monthly active users
  - Unlimited API requests

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

---

**Your AriaHost app is now live!** 🎉

Visit your deployment at: `https://your-project.vercel.app`
