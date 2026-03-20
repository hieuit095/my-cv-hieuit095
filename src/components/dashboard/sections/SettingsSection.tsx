import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";

interface SectionVisibility {
  show_stats: boolean;
  show_services: boolean;
  show_skills: boolean;
  show_experience: boolean;
  show_education: boolean;
  show_projects: boolean;
  show_contact: boolean;
  show_blog: boolean;
}

const sections = [
  { key: "show_stats", label: "Statistics", description: "Years of experience, projects completed, clients served, awards" },
  { key: "show_services", label: "Services", description: "List of services you offer" },
  { key: "show_skills", label: "Skills", description: "Technical skills grouped by category" },
  { key: "show_experience", label: "Experience", description: "Work experience timeline" },
  { key: "show_education", label: "Education", description: "Education and certifications" },
  { key: "show_projects", label: "Projects", description: "Portfolio projects showcase" },
  { key: "show_blog", label: "Blog", description: "Blog posts preview section" },
  { key: "show_contact", label: "Contact", description: "Contact form and information" },
] as const;

export const SettingsSection = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visibility, setVisibility] = useState<SectionVisibility>({
    show_stats: true,
    show_services: true,
    show_skills: true,
    show_experience: true,
    show_education: true,
    show_projects: true,
    show_contact: true,
    show_blog: true,
  });

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("show_stats, show_services, show_skills, show_experience, show_education, show_projects, show_contact, show_blog")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      toast.error("Error loading settings");
    } else if (data) {
      setVisibility({
        show_stats: data.show_stats ?? true,
        show_services: data.show_services ?? true,
        show_skills: data.show_skills ?? true,
        show_experience: data.show_experience ?? true,
        show_education: data.show_education ?? true,
        show_projects: data.show_projects ?? true,
        show_contact: data.show_contact ?? true,
        show_blog: data.show_blog ?? true,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(visibility)
      .eq("id", userId);

    if (error) {
      toast.error("Error saving settings");
    } else {
      toast.success("Settings saved successfully");
    }
    setSaving(false);
  };

  const toggleSection = (key: keyof SectionVisibility) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showAll = () => {
    setVisibility({
      show_stats: true,
      show_services: true,
      show_skills: true,
      show_experience: true,
      show_education: true,
      show_projects: true,
      show_contact: true,
      show_blog: true,
    });
  };

  const hideAll = () => {
    setVisibility({
      show_stats: false,
      show_services: false,
      show_skills: false,
      show_experience: false,
      show_education: false,
      show_projects: false,
      show_contact: false,
      show_blog: false,
    });
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
          <h1 className="text-2xl font-bold font-display text-foreground">Settings</h1>
          <p className="text-muted-foreground">Control which sections appear on your homepage</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Section Visibility */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-foreground">Section Visibility</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={showAll}>
              <Eye className="mr-2 h-4 w-4" />
              Show All
            </Button>
            <Button variant="outline" size="sm" onClick={hideAll}>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide All
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.key}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                visibility[section.key]
                  ? "bg-background border-border"
                  : "bg-muted/30 border-border/50"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{section.label}</h3>
                  {visibility[section.key] ? (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                      Visible
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
              </div>
              <Switch
                checked={visibility[section.key]}
                onCheckedChange={() => toggleSection(section.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-foreground">
          <strong>Note:</strong> Changes will be visible on your public homepage after saving. 
          Hidden sections will not appear to visitors but your data is still saved.
        </p>
      </div>
    </div>
  );
};
