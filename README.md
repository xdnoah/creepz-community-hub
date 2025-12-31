# Creepz NFT Community Hub - Windows 95 Style (V1)

A retro Windows 95-themed web application for the Creepz NFT community featuring real-time chat, user profiles, NFT sales tracking, and Twitter integration.

## Features

### Desktop Experience (≥1024px)
- 🖥️ Full Windows 95 aesthetic with teal desktop background
- 🪟 Draggable and resizable windows using react-rnd
- 💬 Real-time global chat with terminal aesthetics
- 👤 User profiles with customizable bio, age, and location
- 🐊 Live Creepz NFT sales feed via Reservoir API
- 🐦 Embedded Twitter timeline (@CreepzNFT)
- ⏰ Taskbar with clock and window management

### Mobile Experience (<1024px)
- 📱 Simplified full-screen interface
- 🔐 Authentication (login/register)
- 💬 Full-screen terminal-style chat
- ⚡ Touch-optimized input with proper mobile keyboard handling

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + 98.css
- **Database**: Supabase (PostgreSQL + Realtime + Auth)
- **Window System**: react-rnd (desktop only)
- **NFT Data**: Reservoir API (free tier)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd Creepz
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database

Run the SQL schema from the project specification to create:
- `profiles` table
- `messages` table
- `username_history` table
- RLS policies
- Database functions and triggers

5. Start the development server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Database Setup

See the project specification for the complete SQL schema. Key tables:

- **profiles**: User profile information (extends Supabase auth.users)
- **messages**: Chat messages with real-time subscriptions
- **username_history**: Tracks username changes over time

All tables have Row Level Security (RLS) policies enabled.

## Project Structure

```
src/
├── components/
│   ├── Desktop/       # Desktop layout components
│   ├── Mobile/        # Mobile-specific components
│   ├── Windows/       # Window components (chat, profile, etc.)
│   ├── Chat/          # Chat system components
│   └── ui/            # Reusable UI components
├── contexts/          # React contexts (Auth, Windows)
├── hooks/             # Custom React hooks
├── lib/               # Utilities and API clients
├── types/             # TypeScript type definitions
├── App.tsx            # Main app component
└── main.tsx           # App entry point
```

## Features Detail

### Authentication
- Username + password (no wallet connection in V1)
- Real-time username uniqueness validation
- Session persistence via Supabase Auth

### Chat System
- Real-time updates via Supabase Realtime
- Message validation (max 20 words, 15 chars per word)
- Rate limiting (1 message per 2 seconds)
- Clickable usernames to view profiles (desktop only)

### Profile Management
- Editable fields: username, age, location, bio
- Auto-save with debouncing
- Username history tracking
- Password change functionality

### NFT Sales
- Live Creepz sales from Reservoir API
- Auto-refresh every 60 seconds
- Displays: token ID, price in ETH, time since sale

### Window Management (Desktop)
- All windows closed by default
- Drag, resize, minimize functionality
- z-index management for focus
- Taskbar shows minimized windows
- Single instance per window type (except profiles)

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory, ready for deployment to Vercel or any static hosting.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive breakpoint: 1024px

## License

[Add your license here]

## Credits

Built for the Creepz NFT community 🐊
