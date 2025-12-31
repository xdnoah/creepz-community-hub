-- Better solution: Create a function to handle profile creation with proper permissions

-- Drop old policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can create profiles" ON profiles;

-- Create function to create profile (bypasses RLS)
CREATE OR REPLACE FUNCTION create_profile(user_id UUID, user_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow creating profile for the authenticated user
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Cannot create profile for another user';
  END IF;

  -- Insert the profile
  INSERT INTO public.profiles (id, username)
  VALUES (user_id, user_name);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_profile(UUID, TEXT) TO authenticated;

-- Keep the restrictive UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Verify setup
SELECT 'Profile creation function created successfully!' as status;
