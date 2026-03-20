
-- Add section visibility columns to profiles table
ALTER TABLE profiles
ADD COLUMN show_stats boolean DEFAULT true,
ADD COLUMN show_services boolean DEFAULT true,
ADD COLUMN show_skills boolean DEFAULT true,
ADD COLUMN show_experience boolean DEFAULT true,
ADD COLUMN show_education boolean DEFAULT true,
ADD COLUMN show_projects boolean DEFAULT true,
ADD COLUMN show_contact boolean DEFAULT true;
