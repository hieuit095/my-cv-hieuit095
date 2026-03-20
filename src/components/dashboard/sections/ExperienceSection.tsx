import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Edit2, X, Check } from "lucide-react";
import { experienceSchema } from "@/lib/validations";

interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
  highlights: string[];
  display_order: number;
}

export const ExperienceSection = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newExperience, setNewExperience] = useState({
    role: "",
    company: "",
    period: "",
    description: "",
    highlights: "",
  });

  useEffect(() => {
    fetchExperiences();
  }, [userId]);

  const fetchExperiences = async () => {
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("user_id", userId)
      .order("display_order");

    if (error) {
      toast.error("Error loading experiences");
    } else {
      setExperiences(data || []);
    }
    setLoading(false);
  };

  const handleAddExperience = async () => {
    const result = experienceSchema.safeParse(newExperience);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    setErrors({});

    const highlights = newExperience.highlights
      .split(",")
      .map((h) => h.trim())
      .filter((h) => h)
      .slice(0, 20);

    const { data, error } = await supabase
      .from("experiences")
      .insert({
        user_id: userId,
        role: newExperience.role.trim(),
        company: newExperience.company.trim(),
        period: newExperience.period.trim(),
        description: newExperience.description.trim(),
        highlights,
        display_order: experiences.length,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error adding experience");
    } else {
      setExperiences([...experiences, data]);
      setNewExperience({ role: "", company: "", period: "", description: "", highlights: "" });
      toast.success("Experience added successfully");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    const { error } = await supabase.from("experiences").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting experience");
    } else {
      setExperiences(experiences.filter((e) => e.id !== id));
      toast.success("Experience deleted");
    }
  };

  const handleUpdateExperience = async (exp: Experience) => {
    const { error } = await supabase
      .from("experiences")
      .update({
        role: exp.role.slice(0, 200),
        company: exp.company.slice(0, 200),
        period: exp.period.slice(0, 100),
        description: exp.description?.slice(0, 2000),
        highlights: exp.highlights?.slice(0, 20),
      })
      .eq("id", exp.id);

    if (error) {
      toast.error("Error updating experience");
    } else {
      setEditingId(null);
      toast.success("Experience updated");
    }
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
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Experience</h1>
        <p className="text-muted-foreground">Manage your work experience</p>
      </div>

      {/* Add New Experience */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <h2 className="font-semibold text-foreground mb-4">Add New Experience</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Role</label>
            <input
              type="text"
              maxLength={200}
              value={newExperience.role}
              onChange={(e) => setNewExperience({ ...newExperience, role: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.role ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
              placeholder="Senior Developer"
            />
            {errors.role && <p className="text-destructive text-xs mt-1">{errors.role}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Company</label>
            <input
              type="text"
              maxLength={200}
              value={newExperience.company}
              onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.company ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
              placeholder="Google"
            />
            {errors.company && <p className="text-destructive text-xs mt-1">{errors.company}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Period</label>
            <input
              type="text"
              maxLength={100}
              value={newExperience.period}
              onChange={(e) => setNewExperience({ ...newExperience, period: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="2020 - Present"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Highlights (comma separated)
            </label>
            <input
              type="text"
              maxLength={1000}
              value={newExperience.highlights}
              onChange={(e) => setNewExperience({ ...newExperience, highlights: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="React, Node.js, AWS"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              maxLength={2000}
              value={newExperience.description}
              onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Describe your role and achievements..."
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleAddExperience}>
              <Plus className="mr-2 h-4 w-4" />
              Add Experience
            </Button>
          </div>
        </div>
      </div>

      {/* Experience List */}
      <div className="space-y-4">
        {experiences.map((exp) => (
          <div key={exp.id} className="p-6 rounded-xl bg-card border border-border">
            {editingId === exp.id ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    maxLength={200}
                    value={exp.role}
                    onChange={(e) =>
                      setExperiences(experiences.map((x) =>
                        x.id === exp.id ? { ...x, role: e.target.value } : x
                      ))
                    }
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    maxLength={200}
                    value={exp.company}
                    onChange={(e) =>
                      setExperiences(experiences.map((x) =>
                        x.id === exp.id ? { ...x, company: e.target.value } : x
                      ))
                    }
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdateExperience(exp)}>
                    <Check className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{exp.role}</h3>
                  <p className="text-primary">{exp.company}</p>
                  <p className="text-sm text-muted-foreground">{exp.period}</p>
                  <p className="text-muted-foreground mt-2">{exp.description}</p>
                  {exp.highlights && exp.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {exp.highlights.map((h, i) => (
                        <span key={i} className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingId(exp.id)}>
                    <Edit2 size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteExperience(exp.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {experiences.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No experiences added yet. Add your first experience above!</p>
          </div>
        )}
      </div>
    </div>
  );
};
