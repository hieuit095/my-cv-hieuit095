/*
  # Add email to public_profiles view

  ## Changes
  - Drops and recreates the `public_profiles` view to include the `email` column
    so it can be used for the mailto link in the Hero and Footer components.
*/

DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles AS
  SELECT
    id,
    full_name,
    title,
    bio,
    location,
    email,
    profile_image_url,
    github_url,
    linkedin_url,
    twitter_url,
    website_url,
    years_experience,
    projects_completed,
    clients_served,
    awards_won,
    show_stats,
    show_services,
    show_skills,
    show_experience,
    show_education,
    show_projects,
    show_contact,
    show_blog,
    created_at,
    updated_at
  FROM profiles;
