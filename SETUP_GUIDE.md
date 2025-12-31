# Creepz Community Hub - Complete Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm package manager
- A Supabase account (free tier is fine)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React 18 + TypeScript
- Tailwind CSS for styling
- Supabase client for database/auth
- react-rnd for draggable windows
- Vite for development server

### 2. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned (takes ~2 minutes)
3. Once ready, go to **Settings** → **API** in your Supabase dashboard
4. Copy your:
   - **Project URL** (under Project API)
   - **anon/public key** (under Project API keys)

### 3. Configure Environment Variables

1. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `SUPABASE_SETUP.sql`
4. Click **Run** to execute the SQL

This will create:
- ✅ `profiles` table for user data
- ✅ `messages` table for chat
- ✅ `username_history` table for tracking name changes
- ✅ Row Level Security (RLS) policies
- ✅ Realtime subscriptions for chat
- ✅ Database functions and triggers

### 5. Verify Database Setup

In Supabase dashboard:
1. Go to **Table Editor** and verify you see:
   - `profiles`
   - `messages`
   - `username_history`

2. Go to **Database** → **Replication** and verify:
   - `messages` table has realtime enabled

### 6. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 7. Test the Application

#### Desktop (open browser at ≥1024px width):
1. You should see a Windows 95 style desktop with teal background
2. An auth window should appear automatically
3. Try registering a new account:
   - Username: test_user (3-20 chars, alphanumeric + underscore)
   - Password: password123 (min 6 chars)
4. After logging in:
   - Auth window closes
   - Desktop icons are interactive (double-click to open)
   - Try opening chat, profile, sales windows
   - Windows can be dragged, resized, minimized
   - Taskbar shows minimized windows

#### Mobile (resize browser to <1024px width):
1. Should show full-screen auth interface
2. After logging in, shows full-screen chat
3. No profile editing (desktop only)
4. Touch-friendly input

### 8. Build for Production

When ready to deploy:

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Troubleshooting

### Issue: "Missing Supabase environment variables"
- **Solution**: Make sure `.env` file exists with correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Issue: TypeScript errors
- **Solution**: Run `npx tsc --noEmit` to check for type errors

### Issue: Messages not appearing in real-time
- **Solution**:
  1. Check Supabase → Database → Replication
  2. Ensure `messages` table is in the publication
  3. Re-run the SQL: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`

### Issue: Can't register new users
- **Solution**:
  1. Check Supabase → Authentication → Settings
  2. Ensure email confirmations are disabled (or handle confirmation emails)
  3. Check SQL trigger `on_auth_user_created` exists

### Issue: Username availability not checking
- **Solution**: Verify the `check_username_available` function exists in Supabase

## Project Structure Overview

```
Creepz/
├── src/
│   ├── components/
│   │   ├── Desktop/       # Desktop layout (icons, taskbar)
│   │   ├── Mobile/        # Mobile layouts
│   │   ├── Windows/       # Window components (chat, profile, etc.)
│   │   ├── Chat/          # Chat system
│   │   └── ui/            # Reusable UI (buttons, inputs)
│   ├── contexts/          # React contexts (Auth, Windows)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utils, API clients
│   ├── types/             # TypeScript definitions
│   ├── App.tsx            # Main app
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── SUPABASE_SETUP.sql     # Database schema
└── .env                   # Environment variables (create this)
```

## Key Features Implemented

✅ Desktop Windows 95 UI with draggable/resizable windows
✅ Mobile-responsive full-screen interface
✅ Username + password authentication
✅ Real-time chat with terminal aesthetics
✅ User profiles with editable fields
✅ Username change history tracking
✅ NFT sales feed from Reservoir API
✅ Twitter timeline embed
✅ Message validation (20 words max, 15 chars per word)
✅ Rate limiting (1 message per 2 seconds)
✅ Auto-save profile fields
✅ Taskbar with clock and window management

## Next Steps (V2 Ideas)

- 🔮 Wallet connection for NFT holder verification
- 🎨 Theme customization
- 📸 Profile avatars using NFT images
- 🔔 Desktop notifications
- 💾 Message history/search
- 🎮 More desktop apps/games

## Support

For issues or questions:
1. Check this setup guide
2. Review the main README.md
3. Check Supabase logs in dashboard
4. Open an issue on the project repository

---

Built with ❤️ for the Creepz community 🐊
