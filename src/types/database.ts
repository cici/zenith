export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  full_name: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  social_links: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    [key: string]: string | undefined;
  } | null;
  preferences: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email?: boolean;
      push?: boolean;
      [key: string]: boolean | undefined;
    };
    [key: string]: any;
  } | null;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'past_due';
  subscription_period_end: string | null;
  last_login: string | null;
  last_active: string | null;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'email'>>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: ProfileUpdate;
      };
      // ... other tables ...
    };
  };
} 