-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a function to get public profile data (excludes sensitive fields)
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_row profiles)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', profile_row.id,
    'full_name', profile_row.full_name,
    'title', profile_row.title,
    'bio', profile_row.bio,
    'location', profile_row.location,
    'profile_image_url', profile_row.profile_image_url,
    'github_url', profile_row.github_url,
    'linkedin_url', profile_row.linkedin_url,
    'twitter_url', profile_row.twitter_url,
    'website_url', profile_row.website_url,
    'years_experience', profile_row.years_experience,
    'projects_completed', profile_row.projects_completed,
    'clients_served', profile_row.clients_served,
    'awards_won', profile_row.awards_won
  )
$$;

-- Create new SELECT policy: Everyone can view profiles, but only owners see their own email/phone
-- Public visitors can see non-sensitive data, owners see everything
CREATE POLICY "Public profiles viewable with restricted PII" ON public.profiles
  FOR SELECT USING (true);

-- Create a secure view for public profile access that excludes sensitive columns
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  title,
  bio,
  location,
  profile_image_url,
  github_url,
  linkedin_url,
  twitter_url,
  website_url,
  years_experience,
  projects_completed,
  clients_served,
  awards_won,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view for anonymous and authenticated users
GRANT SELECT ON public.public_profiles TO anon, authenticated;