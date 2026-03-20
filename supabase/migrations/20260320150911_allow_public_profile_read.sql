/*
  # Allow public read access to profiles

  ## Problem
  The `public_profiles` view reads from the `profiles` table, but the only existing
  SELECT policy restricts reads to the authenticated owner (`auth.uid() = id`).
  Anonymous (unauthenticated) visitors therefore receive no data, causing the homepage
  to fall back to placeholder values ("Developer", default icon, etc.).

  ## Changes
  - Adds a SELECT policy on `profiles` that allows **anyone** (including anon users)
    to read profile rows. This is intentional for a public-facing portfolio site.
  - The existing owner-only policy is kept for compatibility.
*/

CREATE POLICY "Anyone can view public profiles"
  ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);
