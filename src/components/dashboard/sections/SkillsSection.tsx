import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, GripVertical } from "lucide-react";
import { skillSchema } from "@/lib/validations";

interface Skill {
  id: string;
  name: string;
  category: string;
  icon: string;
  proficiency: number;
  display_order: number;
}

const categories = ["frontend", "backend", "database", "devops", "tools", "soft skills"];

export const SkillsSection = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newSkill, setNewSkill] = useState({
    name: "",
    category: "frontend",
    icon: "⚡",
    proficiency: 80,
  });

  useEffect(() => {
    fetchSkills();
  }, [userId]);

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .eq("user_id", userId)
      .order("display_order");

    if (error) {
      toast.error("Error loading skills");
    } else {
      setSkills(data || []);
    }
    setLoading(false);
  };

  const handleAddSkill = async () => {
    const result = skillSchema.safeParse(newSkill);
    
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
      .from("skills")
      .insert({
        user_id: userId,
        name: newSkill.name.trim(),
        category: newSkill.category,
        icon: newSkill.icon.slice(0, 10),
        proficiency: newSkill.proficiency,
        display_order: skills.length,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error adding skill");
    } else {
      setSkills([...skills, data]);
      setNewSkill({ name: "", category: "frontend", icon: "⚡", proficiency: 80 });
      toast.success("Skill added successfully");
    }
  };

  const handleDeleteSkill = async (id: string) => {
    const { error } = await supabase.from("skills").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting skill");
    } else {
      setSkills(skills.filter((s) => s.id !== id));
      toast.success("Skill deleted");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Skills</h1>
        <p className="text-muted-foreground">Manage your technical and soft skills</p>
      </div>

      {/* Add New Skill */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <h2 className="font-semibold text-foreground mb-4">Add New Skill</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Skill Name
            </label>
            <input
              type="text"
              maxLength={100}
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.name ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
              placeholder="React"
            />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              value={newSkill.category}
              onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Icon (emoji)
            </label>
            <input
              type="text"
              maxLength={10}
              value={newSkill.icon}
              onChange={(e) => setNewSkill({ ...newSkill, icon: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="⚛️"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddSkill} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </Button>
          </div>
        </div>
      </div>

      {/* Skills List */}
      {Object.entries(groupedSkills).map(([category, categorySkills]) => (
        <div key={category} className="p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold text-foreground mb-4 capitalize">{category}</h2>
          <div className="space-y-3">
            {categorySkills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-background border border-border"
              >
                <GripVertical className="text-muted-foreground cursor-move" size={18} />
                <span className="text-xl">{skill.icon}</span>
                <span className="flex-1 text-foreground">{skill.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            ))}
            {categorySkills.length === 0 && (
              <p className="text-muted-foreground text-sm">No skills in this category</p>
            )}
          </div>
        </div>
      ))}

      {skills.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No skills added yet. Add your first skill above!</p>
        </div>
      )}
    </div>
  );
};
