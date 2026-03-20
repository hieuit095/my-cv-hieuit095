import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Get the first user's ID for the portfolio (single-user portfolio site)
export const useFirstUserId = () => {
  return useQuery({
    queryKey: ["first-user-id"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data?.id || null;
    },
  });
};

// Get the first user's profile for the portfolio (single-user portfolio site)
export const useProfile = () => {
  return useQuery({
    queryKey: ["public-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });
};

// Get section visibility settings
export const useSectionVisibility = () => {
  return useQuery({
    queryKey: ["section-visibility"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("show_stats, show_services, show_skills, show_experience, show_education, show_projects, show_contact, show_blog")
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return {
        show_stats: data?.show_stats ?? true,
        show_services: data?.show_services ?? true,
        show_skills: data?.show_skills ?? true,
        show_experience: data?.show_experience ?? true,
        show_education: data?.show_education ?? true,
        show_projects: data?.show_projects ?? true,
        show_contact: data?.show_contact ?? true,
        show_blog: data?.show_blog ?? true,
      };
    },
  });
};

// For owner access to full profile including email/phone
export const useFullProfile = (userId: string) => {
  return useQuery({
    queryKey: ["full-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useServices = () => {
  return useQuery({
    queryKey: ["public-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useSkills = () => {
  return useQuery({
    queryKey: ["public-skills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useExperiences = () => {
  return useQuery({
    queryKey: ["public-experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useEducation = () => {
  return useQuery({
    queryKey: ["public-education"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useProjects = () => {
  return useQuery({
    queryKey: ["public-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useBlogPosts = () => {
  return useQuery({
    queryKey: ["public-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useBlogPost = (slug: string) => {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};
