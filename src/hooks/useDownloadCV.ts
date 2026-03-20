import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateCVPdf } from "@/lib/generateCVPdf";

export const useDownloadCV = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadCV = async () => {
    setIsGenerating(true);
    
    try {
      // Fetch all CV data in parallel
      const [
        profileResult,
        experiencesResult,
        educationResult,
        skillsResult,
        projectsResult,
        servicesResult,
      ] = await Promise.all([
        supabase.from("public_profiles").select("*").limit(1).maybeSingle(),
        supabase.from("experiences").select("*").order("display_order", { ascending: true }),
        supabase.from("education").select("*").order("display_order", { ascending: true }),
        supabase.from("skills").select("*").order("display_order", { ascending: true }),
        supabase.from("projects").select("*").eq("is_published", true).order("display_order", { ascending: true }),
        supabase.from("services").select("*").order("display_order", { ascending: true }),
      ]);

      if (profileResult.error) throw profileResult.error;

      const cvData = {
        profile: profileResult.data,
        experiences: experiencesResult.data || [],
        education: educationResult.data || [],
        skills: skillsResult.data || [],
        projects: projectsResult.data || [],
        services: servicesResult.data || [],
      };

      await generateCVPdf(cvData);
      toast.success("CV downloaded successfully!");
    } catch (error) {
      console.error("Error generating CV:", error);
      toast.error("Failed to generate CV. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return { downloadCV, isGenerating };
};
