-- Drop the security definer view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate as a regular view (SECURITY INVOKER is the default)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
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

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;