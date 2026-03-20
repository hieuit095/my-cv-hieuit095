import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileData {
  full_name: string;
  title: string;
  bio: string;
  profile_image_url: string;
  years_experience: number;
  projects_completed: number;
}

export const PreviewSection = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    setProfile(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Preview</h1>
          <p className="text-muted-foreground">Preview how your CV looks to visitors</p>
        </div>
        <Button onClick={() => window.open("/", "_blank")}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View Public Site
        </Button>
      </div>

      <div className="p-8 rounded-xl bg-card border border-border">
        <div className="text-center mb-8">
          {profile?.profile_image_url ? (
            <img
              src={profile.profile_image_url}
              alt="Profile"
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-primary/30"
            />
          ) : (
            <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-secondary flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          <h2 className="text-3xl font-bold font-display text-foreground">
            {profile?.full_name || "Your Name"}
          </h2>
          <p className="text-primary text-lg">{profile?.title || "Your Title"}</p>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            {profile?.bio || "Add a bio in your profile settings..."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
          <div className="text-center p-4 rounded-lg bg-background">
            <div className="text-2xl font-bold text-foreground">
              {profile?.years_experience || 0}+
            </div>
            <div className="text-xs text-muted-foreground">Years Experience</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-background">
            <div className="text-2xl font-bold text-foreground">
              {profile?.projects_completed || 0}+
            </div>
            <div className="text-xs text-muted-foreground">Projects Done</div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-primary/10 border border-primary/30">
        <h3 className="font-semibold text-foreground mb-2">Tips for a Great CV</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Add a professional profile photo</li>
          <li>• Write a compelling bio that highlights your expertise</li>
          <li>• Include at least 3-5 relevant skills per category</li>
          <li>• List your work experience with measurable achievements</li>
          <li>• Showcase your best projects with images and descriptions</li>
        </ul>
      </div>
    </div>
  );
};
