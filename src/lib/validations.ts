import { z } from "zod";

// URL validation that allows empty strings
const optionalUrl = z.string().max(500).refine(
  (val) => val === "" || /^https?:\/\/.+/.test(val),
  { message: "Must be a valid URL starting with http:// or https://" }
);

// Contact form validation
export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email").max(255, "Email must be less than 255 characters"),
  phone: z.string().min(1, "Phone number is required").max(30, "Phone must be less than 30 characters"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

// Profile validation
export const profileSchema = z.object({
  full_name: z.string().max(100, "Name must be less than 100 characters").optional(),
  title: z.string().max(200, "Title must be less than 200 characters").optional(),
  bio: z.string().max(2000, "Bio must be less than 2000 characters").optional(),
  email: z.string().email("Please enter a valid email").max(255).optional().or(z.literal("")),
  phone: z.string().max(30, "Phone must be less than 30 characters").optional(),
  location: z.string().max(200, "Location must be less than 200 characters").optional(),
  profile_image_url: optionalUrl.optional(),
  github_url: optionalUrl.optional(),
  linkedin_url: optionalUrl.optional(),
  twitter_url: optionalUrl.optional(),
  website_url: optionalUrl.optional(),
  years_experience: z.number().min(0).max(100).optional(),
  projects_completed: z.number().min(0).max(10000).optional(),
  clients_served: z.number().min(0).max(10000).optional(),
  awards_won: z.number().min(0).max(1000).optional(),
});

// Skill validation
export const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required").max(100, "Skill name must be less than 100 characters"),
  category: z.string().min(1, "Category is required").max(50),
  icon: z.string().max(10, "Icon must be a single emoji").optional(),
  proficiency: z.number().min(0).max(100).optional(),
});

// Experience validation
export const experienceSchema = z.object({
  role: z.string().min(1, "Role is required").max(200, "Role must be less than 200 characters"),
  company: z.string().min(1, "Company is required").max(200, "Company must be less than 200 characters"),
  period: z.string().max(100, "Period must be less than 100 characters").optional(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  highlights: z.string().max(1000, "Highlights must be less than 1000 characters").optional(),
});

// Education validation
export const educationSchema = z.object({
  degree: z.string().min(1, "Degree is required").max(200, "Degree must be less than 200 characters"),
  institution: z.string().min(1, "Institution is required").max(200, "Institution must be less than 200 characters"),
  year: z.string().max(50, "Year must be less than 50 characters").optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
});

// Project validation
export const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  category: z.string().max(100, "Category must be less than 100 characters").optional(),
  client: z.string().max(200, "Client must be less than 200 characters").optional(),
  date: z.string().max(50, "Date must be less than 50 characters").optional(),
  image_url: optionalUrl.optional(),
  live_url: optionalUrl.optional(),
  github_url: optionalUrl.optional(),
  tags: z.string().max(500, "Tags must be less than 500 characters").optional(),
});

// Service validation
export const serviceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  icon: z.string().max(10, "Icon must be a single emoji").optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type SkillFormData = z.infer<typeof skillSchema>;
export type ExperienceFormData = z.infer<typeof experienceSchema>;
export type EducationFormData = z.infer<typeof educationSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type ServiceFormData = z.infer<typeof serviceSchema>;

// Blog post validation
export const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  slug: z.string().min(1, "Slug is required").max(200, "Slug must be less than 200 characters").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  excerpt: z.string().max(500, "Excerpt must be less than 500 characters").optional(),
  content: z.string().max(50000, "Content must be less than 50000 characters").optional(),
  cover_image_url: optionalUrl.optional(),
  tags: z.string().max(500, "Tags must be less than 500 characters").optional(),
  reading_time_minutes: z.number().min(1).max(120).optional(),
});

export type BlogPostFormData = z.infer<typeof blogPostSchema>;
