import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Download, Loader as Loader2, User, Briefcase, GraduationCap, Code, FolderOpen, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateCVPdf, PDFColorOptions, DEFAULT_PDF_COLORS } from "@/lib/generateCVPdf";
import { toast } from "sonner";

const COLOR_THEMES: Array<{ name: string } & PDFColorOptions> = [
  { name: "Classic Blue", sidebarBg: "#0f172a", primary: "#1d4ed8", mainText: "#1e293b", mainBg: "#ffffff" },
  { name: "Forest",       sidebarBg: "#14532d", primary: "#16a34a", mainText: "#1c2e20", mainBg: "#ffffff" },
  { name: "Ruby",         sidebarBg: "#7f1d1d", primary: "#dc2626", mainText: "#1c1011", mainBg: "#ffffff" },
  { name: "Ocean",        sidebarBg: "#0c4a6e", primary: "#0284c7", mainText: "#0c3547", mainBg: "#ffffff" },
  { name: "Charcoal",     sidebarBg: "#1c1917", primary: "#d97706", mainText: "#292524", mainBg: "#ffffff" },
  { name: "Slate",        sidebarBg: "#1e293b", primary: "#64748b", mainText: "#1e293b", mainBg: "#f8fafc" },
];

interface CVPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CVData {
  profile: any;
  experiences: any[];
  education: any[];
  skills: any[];
  projects: any[];
  services: any[];
}

interface SectionConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export const CVPreviewModal = ({ open, onOpenChange }: CVPreviewModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [colors, setColors] = useState<PDFColorOptions>(DEFAULT_PDF_COLORS);
  const [sections, setSections] = useState<SectionConfig[]>([
    { id: "summary", label: "Professional Summary", icon: <User className="h-4 w-4" />, enabled: true },
    { id: "experience", label: "Work Experience", icon: <Briefcase className="h-4 w-4" />, enabled: true },
    { id: "education", label: "Education", icon: <GraduationCap className="h-4 w-4" />, enabled: true },
    { id: "skills", label: "Skills & Expertise", icon: <Code className="h-4 w-4" />, enabled: true },
    { id: "projects", label: "Featured Projects", icon: <FolderOpen className="h-4 w-4" />, enabled: true },
    { id: "services", label: "Services Offered", icon: <Wrench className="h-4 w-4" />, enabled: true },
  ]);

  useEffect(() => {
    if (open) {
      fetchCVData();
    }
  }, [open]);

  const fetchCVData = async () => {
    setIsLoading(true);
    try {
      const [profileResult, experiencesResult, educationResult, skillsResult, projectsResult, servicesResult] = 
        await Promise.all([
          supabase.from("public_profiles").select("*").limit(1).maybeSingle(),
          supabase.from("experiences").select("*").order("display_order", { ascending: true }),
          supabase.from("education").select("*").order("display_order", { ascending: true }),
          supabase.from("skills").select("*").order("display_order", { ascending: true }),
          supabase.from("projects").select("*").eq("is_published", true).order("display_order", { ascending: true }),
          supabase.from("services").select("*").order("display_order", { ascending: true }),
        ]);

      setCvData({
        profile: profileResult.data,
        experiences: experiencesResult.data || [],
        education: educationResult.data || [],
        skills: skillsResult.data || [],
        projects: projectsResult.data || [],
        services: servicesResult.data || [],
      });
    } catch (error) {
      console.error("Error fetching CV data:", error);
      toast.error("Failed to load CV data");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId ? { ...section, enabled: !section.enabled } : section
      )
    );
  };

  const handleDownload = async () => {
    if (!cvData) return;

    setIsGenerating(true);
    try {
      const enabledSections = sections.reduce((acc, section) => {
        acc[section.id] = section.enabled;
        return acc;
      }, {} as Record<string, boolean>);

      await generateCVPdf(cvData, enabledSections, colors);
      toast.success("CV downloaded successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating CV:", error);
      toast.error("Failed to generate CV");
    } finally {
      setIsGenerating(false);
    }
  };

  const getSectionCount = (sectionId: string): number => {
    if (!cvData) return 0;
    switch (sectionId) {
      case "experience": return cvData.experiences.length;
      case "education": return cvData.education.length;
      case "skills": return cvData.skills.length;
      case "projects": return cvData.projects.length;
      case "services": return cvData.services.length;
      default: return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-display">CV Preview & Download</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row h-[calc(90vh-120px)]">
          {/* Section Controls */}
          <div className="w-full md:w-72 border-r border-border p-4 bg-muted/30 overflow-y-auto">
            <h3 className="font-semibold text-sm text-muted-foreground mb-4">INCLUDE SECTIONS</h3>
            <div className="space-y-3">
              {sections.map((section) => {
                const count = getSectionCount(section.id);
                const isEmpty = section.id !== "summary" && count === 0;
                
                return (
                  <div
                    key={section.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      section.enabled && !isEmpty ? "bg-primary/10" : "hover:bg-muted"
                    } ${isEmpty ? "opacity-50" : ""}`}
                  >
                    <Checkbox
                      id={section.id}
                      checked={section.enabled && !isEmpty}
                      onCheckedChange={() => toggleSection(section.id)}
                      disabled={isEmpty}
                    />
                    <Label
                      htmlFor={section.id}
                      className="flex items-center gap-2 flex-1 cursor-pointer text-sm"
                    >
                      <span className="text-primary">{section.icon}</span>
                      <span>{section.label}</span>
                      {section.id !== "summary" && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          ({count})
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
            
            <Separator className="my-4" />

            <h3 className="font-semibold text-sm text-muted-foreground mb-3">COLOR THEME</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {COLOR_THEMES.map((theme) => {
                const isActive =
                  colors.sidebarBg === theme.sidebarBg &&
                  colors.primary === theme.primary;
                return (
                  <button
                    key={theme.name}
                    title={theme.name}
                    onClick={() => setColors({ sidebarBg: theme.sidebarBg, primary: theme.primary, mainText: theme.mainText, mainBg: theme.mainBg })}
                    className={`flex items-center gap-1 rounded-lg p-1.5 border transition-all text-xs font-medium ${isActive ? "border-primary ring-1 ring-primary" : "border-border hover:border-muted-foreground"}`}
                  >
                    <span className="w-5 h-5 rounded-sm flex-shrink-0 border border-white/20" style={{ background: theme.sidebarBg }} />
                    <span className="w-3 h-5 rounded-sm flex-shrink-0" style={{ background: theme.primary }} />
                    <span className="text-muted-foreground truncate leading-none">{theme.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 mb-4">
              {(
                [
                  { key: "sidebarBg", label: "Sidebar" },
                  { key: "primary",   label: "Accent" },
                  { key: "mainText",  label: "Text" },
                  { key: "mainBg",    label: "Background" },
                ] as const
              ).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground w-24">{label}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={(e) => setColors((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent p-0.5"
                    />
                    <span className="text-xs text-muted-foreground font-mono">{colors[key]}</span>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <Button
              onClick={handleDownload}
              className="w-full"
              disabled={isLoading || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? "Generating..." : "Download PDF"}
            </Button>
          </div>

          {/* Preview Area */}
          <ScrollArea className="flex-1 h-full">
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : cvData ? (
                <div className="border border-border rounded-lg shadow-lg overflow-hidden" style={{ background: colors.mainBg }}>
                  {/* Sidebar strip + header */}
                  <div className="flex">
                    <div className="w-3 flex-shrink-0" style={{ background: colors.sidebarBg }} />
                    <div className="flex-1 p-6" style={{ borderLeft: `3px solid ${colors.primary}` }}>
                      <h1 className="text-2xl font-bold" style={{ color: colors.mainText }}>{cvData.profile?.full_name || "Your Name"}</h1>
                      <p className="font-medium" style={{ color: colors.primary }}>{cvData.profile?.title || "Your Title"}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {cvData.profile?.location || "Location"}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 space-y-6" style={{ background: colors.mainBg }}>
                    {sections.find(s => s.id === "summary")?.enabled && cvData.profile?.bio && (
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: colors.primary }}>
                          Professional Summary
                        </h2>
                        <p className="text-sm text-muted-foreground line-clamp-3" style={{ color: colors.mainText }}>
                          {cvData.profile.bio}
                        </p>
                      </div>
                    )}

                    {sections.find(s => s.id === "experience")?.enabled && cvData.experiences.length > 0 && (
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: colors.primary }}>
                          Work Experience
                        </h2>
                        <div className="space-y-3">
                          {cvData.experiences.slice(0, 2).map((exp: any) => (
                            <div key={exp.id} className="border-l-2 pl-3" style={{ borderColor: colors.primary + "40" }}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-sm" style={{ color: colors.mainText }}>{exp.role}</p>
                                  <p className="text-xs text-muted-foreground">{exp.company}</p>
                                </div>
                                <span className="text-xs" style={{ color: colors.primary }}>{exp.period}</span>
                              </div>
                            </div>
                          ))}
                          {cvData.experiences.length > 2 && (
                            <p className="text-xs text-muted-foreground">+{cvData.experiences.length - 2} more entries...</p>
                          )}
                        </div>
                      </div>
                    )}

                    {sections.find(s => s.id === "education")?.enabled && cvData.education.length > 0 && (
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: colors.primary }}>
                          Education
                        </h2>
                        <div className="space-y-2">
                          {cvData.education.slice(0, 2).map((edu: any) => (
                            <div key={edu.id} className="flex justify-between">
                              <div>
                                <p className="font-semibold text-sm" style={{ color: colors.mainText }}>{edu.degree}</p>
                                <p className="text-xs text-muted-foreground">{edu.institution}</p>
                              </div>
                              <span className="text-xs" style={{ color: colors.primary }}>{edu.year}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sections.find(s => s.id === "skills")?.enabled && cvData.skills.length > 0 && (
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: colors.primary }}>
                          Skills
                        </h2>
                        <div className="flex flex-wrap gap-1">
                          {cvData.skills.slice(0, 8).map((skill: any) => (
                            <span
                              key={skill.id}
                              className="px-2 py-0.5 text-xs rounded"
                              style={{ background: colors.primary + "20", color: colors.primary }}
                            >
                              {skill.name}
                            </span>
                          ))}
                          {cvData.skills.length > 8 && (
                            <span className="text-xs text-muted-foreground">+{cvData.skills.length - 8} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {sections.find(s => s.id === "projects")?.enabled && cvData.projects.length > 0 && (
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: colors.primary }}>
                          Featured Projects
                        </h2>
                        <div className="grid grid-cols-2 gap-2">
                          {cvData.projects.slice(0, 4).map((project: any) => (
                            <div key={project.id} className="p-2 bg-muted/30 rounded text-xs">
                              <p className="font-semibold" style={{ color: colors.mainText }}>{project.title}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sections.find(s => s.id === "services")?.enabled && cvData.services.length > 0 && (
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: colors.primary }}>
                          Services
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {cvData.services.map((s: any) => s.title).join(" • ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center">No data available</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
