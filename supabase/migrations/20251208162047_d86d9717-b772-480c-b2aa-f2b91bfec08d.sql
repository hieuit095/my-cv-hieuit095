-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Public profiles viewable with restricted PII" ON public.profiles;

-- Create a restrictive SELECT policy that only allows profile owners to read their full data
-- Public access should go through the public_profiles view which excludes PII
CREATE POLICY "Only owners can read full profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);