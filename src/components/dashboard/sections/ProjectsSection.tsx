import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Upload, Eye, EyeOff } from "lucide-react";
import { projectSchema } from "@/lib/validations";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  client: string;
  date: string;
  image_url: string;
  live_url: string;
  github_url: string;
  tags: string[];
  is_published: boolean;
  display_order: number;
}

export const ProjectsSection = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    category: "",
    client: "",
    date: "",
    image_url: "",
    live_url: "",
    github_url: "",
    tags: "",
    is_published: true,
  });

  useEffect(() => {
    fetchProjects();
  }, [userId]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("display_order");

    if (error) {
      toast.error("Error loading projects");
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("project-images")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Error uploading image");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("project-images").getPublicUrl(filePath);
    setNewProject({ ...newProject, image_url: data.publicUrl });
    setUploading(false);
    toast.success("Image uploaded");
  };

  const handleAddProject = async () => {
    const result = projectSchema.safeParse(newProject);
    
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

    const tags = newProject.tags.split(",").map((t) => t.trim()).filter((t) => t).slice(0, 20);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        title: newProject.title.trim(),
        description: newProject.description.trim(),
        category: newProject.category.trim(),
        client: newProject.client.trim(),
        date: newProject.date.trim(),
        image_url: newProject.image_url,
        live_url: newProject.live_url.trim(),
        github_url: newProject.github_url.trim(),
        tags,
        is_published: newProject.is_published,
        display_order: projects.length,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error adding project");
    } else {
      setProjects([...projects, data]);
      setNewProject({
        title: "",
        description: "",
        category: "",
        client: "",
        date: "",
        image_url: "",
        live_url: "",
        github_url: "",
        tags: "",
        is_published: true,
      });
      setShowForm(false);
      toast.success("Project added successfully");
    }
  };

  const handleDeleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting project");
    } else {
      setProjects(projects.filter((p) => p.id !== id));
      toast.success("Project deleted");
    }
  };

  const togglePublished = async (project: Project) => {
    const { error } = await supabase
      .from("projects")
      .update({ is_published: !project.is_published })
      .eq("id", project.id);

    if (error) {
      toast.error("Error updating project");
    } else {
      setProjects(
        projects.map((p) =>
          p.id === project.id ? { ...p, is_published: !p.is_published } : p
        )
      );
      toast.success(project.is_published ? "Project hidden" : "Project published");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Projects</h1>
          <p className="text-muted-foreground">Manage your portfolio projects</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Add New Project Form */}
      {showForm && (
        <div className="p-6 rounded-xl bg-card border border-border animate-fade-in">
          <h2 className="font-semibold text-foreground mb-4">New Project</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <input
                type="text"
                maxLength={200}
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.title ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary`}
                placeholder="E-Learning Platform"
              />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <input
                type="text"
                maxLength={100}
                value={newProject.category}
                onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                placeholder="Full Stack"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Client</label>
              <input
                type="text"
                maxLength={200}
                value={newProject.client}
                onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                placeholder="Company Inc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date</label>
              <input
                type="text"
                maxLength={50}
                value={newProject.date}
                onChange={(e) => setNewProject({ ...newProject, date: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                placeholder="Jan 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Live URL</label>
              <input
                type="url"
                maxLength={500}
                value={newProject.live_url}
                onChange={(e) => setNewProject({ ...newProject, live_url: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.live_url ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary`}
                placeholder="https://..."
              />
              {errors.live_url && <p className="text-destructive text-xs mt-1">{errors.live_url}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">GitHub URL</label>
              <input
                type="url"
                maxLength={500}
                value={newProject.github_url}
                onChange={(e) => setNewProject({ ...newProject, github_url: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.github_url ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary`}
                placeholder="https://github.com/..."
              />
              {errors.github_url && <p className="text-destructive text-xs mt-1">{errors.github_url}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Tags (comma separated)</label>
              <input
                type="text"
                maxLength={500}
                value={newProject.tags}
                onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                placeholder="React, Node.js, PostgreSQL"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                maxLength={2000}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary resize-none"
                placeholder="Describe your project..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Project Image</label>
              <div className="flex items-center gap-4">
                {newProject.image_url && (
                  <img
                    src={newProject.image_url}
                    alt="Preview"
                    className="w-24 h-16 object-cover rounded-lg"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="project-image"
                />
                <label htmlFor="project-image">
                  <Button variant="outline" asChild disabled={uploading}>
                    <span>
                      {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload Image
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground">Max 5MB</p>
              </div>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={handleAddProject}>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`p-4 rounded-xl bg-card border border-border ${
              !project.is_published ? "opacity-60" : ""
            }`}
          >
            {project.image_url && (
              <img
                src={project.image_url}
                alt={project.title}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
            )}
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-xs text-primary font-medium">{project.category}</span>
                <h3 className="font-semibold text-foreground">{project.title}</h3>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePublished(project)}
                  title={project.is_published ? "Hide" : "Publish"}
                >
                  {project.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteProject(project.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {project.description}
            </p>
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs rounded-md bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {projects.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No projects added yet. Click "Add Project" to get started!</p>
        </div>
      )}
    </div>
  );
};
