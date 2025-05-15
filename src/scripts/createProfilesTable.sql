-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow public read access (for usernames, avatars, etc.)
CREATE POLICY "Profiles are publicly viewable" 
  ON profiles FOR SELECT USING (true);

-- Allow users to update their own profiles
CREATE POLICY "Users can update their own profiles" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profiles
CREATE POLICY "Users can insert their own profiles" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to automatically create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at, updated_at)
  VALUES (
    NEW.id, 
    LOWER(SUBSTRING(NEW.email FROM 1 FOR POSITION('@' IN NEW.email) - 1)) || FLOOR(RANDOM() * 1000)::TEXT,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that calls this function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to check if the profiles table exists
CREATE OR REPLACE FUNCTION public.create_profiles_if_not_exists()
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT UNIQUE,
      full_name TEXT,
      bio TEXT,
      website TEXT,
      location TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
    
    -- Enable RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Set up policies
    CREATE POLICY "Profiles are publicly viewable" 
      ON profiles FOR SELECT USING (true);
    
    CREATE POLICY "Users can update their own profiles" 
      ON profiles FOR UPDATE USING (auth.uid() = id);
    
    CREATE POLICY "Users can insert their own profiles" 
      ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END;
$$ LANGUAGE plpgsql; 