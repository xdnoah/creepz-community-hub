export type WindowType = 'auth' | 'chat' | 'myProfile' | 'profile' | 'sales' | 'twitter' | 'onlineUsers' | 'dmList' | 'dm' | 'settings' | 'raid' | 'lizardgoshi' | 'activity';

export interface WindowConfig {
  width: number;
  height: number;
  x: number;
  y: number;
  minWidth: number;
  minHeight: number;
}

export interface WindowState {
  id: string;
  type: WindowType;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  previousPosition?: { x: number; y: number }; // Store position before maximize
  previousSize?: { width: number; height: number }; // Store size before maximize
  data?: any; // For passing data like userId for profile windows
}

export interface User {
  id: string;
  username: string;
  age?: number;
  location?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  background_color?: string;
  font_size?: 'small' | 'medium' | 'large' | 'xlarge';
  chat_name_color?: string;
  enable_sounds?: boolean;
  timestamp_format?: '12h' | '24h';
  theme_preset?: 'classic' | 'dark' | 'pastel' | 'high-contrast';
}

export interface UserSettings {
  background_color: string;
  font_size: 'small' | 'medium' | 'large' | 'xlarge';
  chat_name_color: string;
  enable_sounds: boolean;
  timestamp_format: '12h' | '24h';
  theme_preset: 'classic' | 'dark' | 'pastel' | 'high-contrast';
}

export interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
  };
}

export interface UsernameHistory {
  id: string;
  user_id: string;
  old_username: string;
  new_username: string;
  changed_at: string;
}

export interface Profile extends User {
  username_history?: UsernameHistory[];
}

export interface NftSale {
  id: string;
  token: {
    tokenId: string;
    image: string;
  };
  price: {
    amount: {
      decimal: number;
    };
  };
  timestamp: number;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    username: string;
  };
  receiver?: {
    username: string;
  };
}

export interface DMConversation {
  other_user_id: string;
  other_username: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface UserPresence {
  user_id: string;
  username: string;
  status: 'online' | 'offline';
  last_seen: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
}

export interface Lizard {
  id: string;
  name: string;
  gender: 'male' | 'female';
  level: number;
  hp: number;
  def: number;
  atk: number;
  crit_rate: number;
  crit_damage: number;
  gold: number;
  passive_income: number;
  total_gold_earned: number;
  last_gold_update: string;
  fed_at: string | null;
  is_fed: boolean;
  last_login: string;
  login_streak: number;
  login_streak_claimed: boolean;
  messages_sent: number;
  total_levels_gained: number;
  created_at: string;
  updated_at: string;
}

export interface RaidedTweet {
  id: string;
  user_id: string;
  raid_link_id: string;
  raided_at: string;
  created_at: string;
}

export interface RaidLinkWithRaided {
  id: string;
  user_id: string;
  username: string;
  tweet_url: string;
  description: string | null;
  created_at: string;
  is_raided?: boolean; // Client-side flag
}

export interface StatIncrease {
  stat: 'hp' | 'def' | 'atk' | 'crit_rate' | 'crit_damage';
  amount: number;
  displayName: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: (lizard: Lizard) => boolean;
  reward: number;
  unlocked: boolean;
}

export type ActivityType =
  | 'user_joined'
  | 'raid_added'
  | 'tweet_raided'
  | 'lizard_levelup'
  | 'login_streak_milestone'
  | 'lizard_fed'
  | 'daily_reward_claimed';

export interface ActivityLog {
  id: string;
  user_id: string;
  username: string;
  activity_type: ActivityType;
  metadata: Record<string, any> | null;
  created_at: string;
}

export const WINDOW_DEFAULTS: Record<WindowType, WindowConfig> = {
  auth: { width: 380, height: 340, x: 470, y: 220, minWidth: 320, minHeight: 300 },
  chat: { width: 500, height: 400, x: 50, y: 50, minWidth: 400, minHeight: 300 },
  myProfile: { width: 380, height: 520, x: 200, y: 60, minWidth: 350, minHeight: 450 },
  profile: { width: 350, height: 380, x: 280, y: 120, minWidth: 320, minHeight: 350 },
  sales: { width: 320, height: 400, x: 600, y: 50, minWidth: 300, minHeight: 350 },
  twitter: { width: 400, height: 500, x: 520, y: 30, minWidth: 350, minHeight: 400 },
  onlineUsers: { width: 320, height: 450, x: 400, y: 100, minWidth: 300, minHeight: 350 },
  dmList: { width: 400, height: 450, x: 350, y: 80, minWidth: 350, minHeight: 350 },
  dm: { width: 480, height: 420, x: 300, y: 120, minWidth: 400, minHeight: 350 },
  settings: { width: 520, height: 580, x: 250, y: 80, minWidth: 480, minHeight: 500 },
  raid: { width: 450, height: 500, x: 420, y: 70, minWidth: 400, minHeight: 450 },
  lizardgoshi: { width: 550, height: 600, x: 350, y: 50, minWidth: 500, minHeight: 550 },
  activity: { width: 500, height: 450, x: 380, y: 90, minWidth: 450, minHeight: 400 },
};

export const MOBILE_BREAKPOINT = 1024;

export const CREEPZ_CONTRACT_ADDRESS = '0xfe8c6d19365453d26af321d0e8c910428c23873f';
