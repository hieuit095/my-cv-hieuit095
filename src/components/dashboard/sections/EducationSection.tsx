import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Edit2, X, Check } from "lucide-react";
import { educationSchema } from "@/lib/validations";

interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
  description: string;
  display_order: number;
}

export const EducationSection = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [education, setEducation] = useState<Education[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newEducation, setNewEducation] = useState({
    degree: "",
    institution: "",
    year: "",
    description: "",
  });

  useEffect(() => {
    fetchEducation();
  }, [userId]);

  const fetchEducation = async () => {
    const { data, error } = await supabase
      .from("education")
      .select("*")
      .eq("user_id", userId)
      .order("display_order");

    if (error) {
      toast.error("Error loading education");
    } else {
      setEducation(data || []);
    }
    setLoading(false);
  };

  const handleAddEducation = async () => {
    const result = educationSchema.safeParse(newEducation);
    
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

    const { data, error } = await supabase
      .from("education")
      .insert({
        user_id: userId,
        degree: newEducation.degree.trim(),
        institution: newEducation.institution.trim(),
        year: newEducation.year.trim(),
        description: newEducation.description.trim(),
        display_order: education.length,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error adding education");
    } else {
      setEducation([...education, data]);
      setNewEducation({ degree: "", institution: "", year: "", description: "" });
      toast.success("Education added successfully");
    }
  };

  const handleDeleteEducation = async (id: string) => {
    const { error } = await supabase.from("education").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting education");
    } else {
      setEducation(education.filter((e) => e.id !== id));
      toast.success("Education deleted");
    }
  };

  const handleUpdateEducation = async (edu: Education) => {
    const { error } = await supabase
      .from("education")
      .update({
        degree: edu.degree.slice(0, 200),
        institution: edu.institution.slice(0, 200),
        year: edu.year.slice(0, 50),
        description: edu.description?.slice(0, 1000),
      })
      .eq("id", edu.id);

    if (error) {
      toast.error("Error updating education");
    } else {
      setEditingId(null);
      toast.success("Education updated");
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
        <h1 className="text-2xl font-bold font-display text-foreground">Education</h1>
        <p className="text-muted-foreground">Manage your educational background</p>
      </div>

      {/* Add New Education */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <h2 className="font-semibold text-foreground mb-4">Add New Education</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Degree/Certificate</label>
            <input
              type="text"
              maxLength={200}
              value={newEducation.degree}
              onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.degree ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
              placeholder="M.Sc. Computer Science"
            />
            {errors.degree && <p className="text-destructive text-xs mt-1">{errors.degree}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Institution</label>
            <input
              type="text"
              maxLength={200}
              value={newEducation.institution}
              onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.institution ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
              placeholder="Stanford University"
            />
            {errors.institution && <p className="text-destructive text-xs mt-1">{errors.institution}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Year</label>
            <input
              type="text"
              maxLength={50}
              value={newEducation.year}
              onChange={(e) => setNewEducation({ ...newEducation, year: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="2015 - 2017"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              maxLength={1000}
              value={newEducation.description}
              onChange={(e) => setNewEducation({ ...newEducation, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Brief description..."
            />
          </div>
          <div>
            <Button onClick={handleAddEducation}>
              <Plus className="mr-2 h-4 w-4" />
              Add Education
            </Button>
          </div>
        </div>
      </div>

      {/* Education List */}
      <div className="space-y-4">
        {education.map((edu) => (
          <div key={edu.id} className="p-6 rounded-xl bg-card border border-border">
            {editingId === edu.id ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    maxLength={200}
                    value={edu.degree}
                    onChange={(e) =>
                      setEducation(education.map((x) =>
                        x.id === edu.id ? { ...x, degree: e.target.value } : x
                      ))
                    }
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    maxLength={200}
                    value={edu.institution}
                    onChange={(e) =>
                      setEducation(education.map((x) =>
                        x.id === edu.id ? { ...x, institution: e.target.value } : x
                      ))
                    }
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdateEducation(edu)}>
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
                  <h3 className="font-semibold text-foreground">{edu.degree}</h3>
                  <p className="text-primary">{edu.institution}</p>
                  <p className="text-sm text-muted-foreground">{edu.year}</p>
                  {edu.description && (
                    <p className="text-muted-foreground mt-2">{edu.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingId(edu.id)}>
                    <Edit2 size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteEducation(edu.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {education.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No education entries added yet. Add your first entry above!</p>
          </div>
        )}
      </div>
    </div>
  );
};
