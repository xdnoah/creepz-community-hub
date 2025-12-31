# New Features Setup Guide

## Online Users List, Direct Messages & Desktop Notifications

Three awesome new features have been implemented! Follow these steps to set them up:

---

## Step 1: Run Database Scripts in Supabase

You need to run **TWO SQL scripts** in your Supabase SQL Editor:

### 1.1 Run DM_PRESENCE_SETUP.sql

1. Go to your Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `DM_PRESENCE_SETUP.sql`
4. Paste and click "Run"
5. You should see: `"DM and Presence system setup complete!"`

This creates:
- `direct_messages` table for storing DMs
- RLS policies for message security
- Helper functions for conversations and unread counts
- Realtime subscriptions for live updates

### 1.2 Run PRESENCE_SETUP.sql

1. In Supabase SQL Editor, click "New Query" again
2. Copy the entire contents of `PRESENCE_SETUP.sql`
3. Paste and click "Run"
4. You should see: `"Presence system setup complete!"`

This creates:
- `user_presence` table for tracking online/offline status
- RLS policies for presence visibility
- Functions for updating and fetching online users
- Realtime subscriptions for live presence updates

---

## Step 2: Verify Everything Works

The app should automatically start using these features!

### Test Online Users List:
1. Open the desktop app
2. Look for the new **"Who's Online"** desktop icon (👥)
3. Double-click it to see all users with online/offline status
4. You should see yourself as "Online" with a green dot

### Test Direct Messages:
1. Look for the new **"Messages"** desktop icon (📬)
2. Double-click it to open your DM list
3. From "Who's Online" window, click any user to start a DM
4. A new DM window opens where you can chat privately
5. Messages are limited to 1000 characters
6. Press Enter to send, Shift+Enter for new line

### Test Desktop Notifications:
1. When you receive a new DM, a Windows 95-style notification appears in the bottom-right
2. Notification shows the sender and message preview
3. Auto-dismisses after 5 seconds
4. Click the X to close manually

---

## Features Overview

### 1. Online Users List (Who's Online)
- **Desktop Icon:** 👥 "Who's Online"
- **Start Menu:** Also accessible from Start Menu
- Shows all users with online/offline status
- Green dot = online, Gray dot = offline
- Click any user to send them a DM
- Auto-updates in real-time

### 2. Direct Messages
- **Desktop Icon:** 📬 "Messages"
- **Start Menu:** Also accessible from Start Menu
- Shows all your conversations
- Unread count badge on window title
- Click conversation to open DM window
- Messages limited to 1000 characters
- Real-time delivery and read receipts
- Mark as read when you view them

### 3. Desktop Notifications
- Automatically triggered when:
  - New DM received
  - (More triggers can be added: mentions, friend online, etc.)
- Windows 95 style toast notification
- Appears bottom-right corner
- Auto-dismiss after 5 seconds
- Click X to close manually

---

## Database Structure

### direct_messages table:
```sql
- id: UUID (primary key)
- sender_id: UUID (references profiles)
- receiver_id: UUID (references profiles)
- content: TEXT (max 1000 chars)
- read: BOOLEAN (default false)
- created_at: TIMESTAMPTZ
```

### user_presence table:
```sql
- user_id: UUID (primary key, references profiles)
- status: TEXT ('online' or 'offline')
- last_seen: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

---

## How It Works Technically

### Presence Tracking:
- When you log in, your status is set to "online"
- Updated every 30 seconds while you're active
- Set to "offline" when you close the browser
- Uses Supabase Realtime for live updates

### Direct Messages:
- Stored securely with Row Level Security
- Only sender and receiver can see messages
- Real-time delivery via Supabase Realtime
- Unread counts tracked server-side

### Notifications:
- Pure client-side React state management
- Slide-in animation from right
- Auto-dismiss timer
- Can be manually closed

---

## Troubleshooting

### "Failed to update presence" error:
- Make sure you ran PRESENCE_SETUP.sql
- Check Supabase logs for errors
- Verify RLS policies are enabled

### "Failed to send message" error:
- Make sure you ran DM_PRESENCE_SETUP.sql
- Check that both users exist in profiles table
- Verify you're logged in

### Not seeing other users online:
- They need to be actively using the app
- Presence updates every 30 seconds
- Check if Realtime is enabled in Supabase

### Notifications not appearing:
- This is client-side only, no database setup needed
- Check browser console for errors
- Make sure Desktop.tsx has useNotifications hook

---

## Next Steps

You now have:
- ✅ Online Users List with real-time presence
- ✅ Direct Messages with unread tracking
- ✅ Desktop Notifications

Future enhancements you could add:
- Notification for @mentions in chat
- Notification when friend comes online
- Sound effects for notifications
- DM read receipts
- Typing indicators
- Image sharing in DMs

Enjoy your new features! 🚀
