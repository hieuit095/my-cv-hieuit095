import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader as Loader2, Upload, Eye, EyeOff, CreditCard as Edit, Calendar, Clock, Sparkles } from "lucide-react";
import { blogPostSchema } from "@/lib/validations";
import { format } from "date-fns";
import { MarkdownEditor } from "../MarkdownEditor";
import { AIBlogGenerator } from "../AIBlogGenerator";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  reading_time_minutes: number;
}

export const BlogSection = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    tags: "",
    reading_time_minutes: 5,
  });

  useEffect(() => {
    fetchPosts();
  }, [userId]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading blog posts");
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingPost ? formData.slug : generateSlug(title),
    });
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
    const filePath = `${userId}/blog/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("project-images")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Error uploading image");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("project-images").getPublicUrl(filePath);
    setFormData({ ...formData, cover_image_url: data.publicUrl });
    setUploading(false);
    toast.success("Image uploaded");
  };

  const handleAIGenerated = (data: {
    title: string;
    excerpt: string;
    tags: string;
    reading_time: number;
    content: string;
    cover_image_url: string;
  }) => {
    setFormData({
      title: data.title,
      slug: generateSlug(data.title),
      excerpt: data.excerpt,
      content: data.content,
      cover_image_url: data.cover_image_url,
      tags: data.tags,
      reading_time_minutes: data.reading_time,
    });
    setEditingPost(null);
    setErrors({});
    setShowAIGenerator(false);
    setShowForm(true);
    toast.success("Blog post generated! Review and publish when ready.");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image_url: "",
      tags: "",
      reading_time_minutes: 5,
    });
    setEditingPost(null);
    setErrors({});
    setShowForm(false);
  };

  const handleSubmit = async () => {
    const result = blogPostSchema.safeParse(formData);

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
    const tags = formData.tags.split(",").map((t) => t.trim()).filter((t) => t).slice(0, 10);

    if (editingPost) {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          excerpt: formData.excerpt.trim(),
          content: formData.content,
          cover_image_url: formData.cover_image_url,
          tags,
          reading_time_minutes: formData.reading_time_minutes,
        })
        .eq("id", editingPost.id);

      if (error) {
        toast.error("Error updating post");
      } else {
        toast.success("Post updated successfully");
        fetchPosts();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("blog_posts").insert({
        user_id: userId,
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content,
        cover_image_url: formData.cover_image_url,
        tags,
        reading_time_minutes: formData.reading_time_minutes,
        is_published: false,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("A post with this slug already exists");
        } else {
          toast.error("Error creating post");
        }
      } else {
        toast.success("Post created successfully");
        fetchPosts();
        resetForm();
      }
    }
  };

  const handleEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content || "",
      cover_image_url: post.cover_image_url || "",
      tags: post.tags?.join(", ") || "",
      reading_time_minutes: post.reading_time_minutes || 5,
    });
    setEditingPost(post);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting post");
    } else {
      setPosts(posts.filter((p) => p.id !== id));
      toast.success("Post deleted");
    }
  };

  const togglePublished = async (post: BlogPost) => {
    const newPublishedState = !post.is_published;
    const { error } = await supabase
      .from("blog_posts")
      .update({
        is_published: newPublishedState,
        published_at: newPublishedState ? new Date().toISOString() : null,
      })
      .eq("id", post.id);

    if (error) {
      toast.error("Error updating post");
    } else {
      setPosts(
        posts.map((p) =>
          p.id === post.id
            ? { ...p, is_published: newPublishedState, published_at: newPublishedState ? new Date().toISOString() : null }
            : p
        )
      );
      toast.success(newPublishedState ? "Post published" : "Post unpublished");
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
          <h1 className="text-2xl font-bold font-display text-foreground">Blog</h1>
          <p className="text-muted-foreground">Write and manage blog posts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAIGenerator(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      {showAIGenerator && (
        <AIBlogGenerator
          userId={userId}
          onGenerated={handleAIGenerated}
          onClose={() => setShowAIGenerator(false)}
        />
      )}

      {/* Post Form */}
      {showForm && (
        <div className="p-6 rounded-xl bg-card border border-border animate-fade-in">
          <h2 className="font-semibold text-foreground mb-4">
            {editingPost ? "Edit Post" : "New Post"}
          </h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                <input
                  type="text"
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.title ? "border-destructive" : "border-border"} text-foreground focus:outline-none focus:border-primary`}
                  placeholder="My awesome blog post"
                />
                {errors.title && <p className="text-destructive text-xs mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Slug</label>
                <input
                  type="text"
                  maxLength={200}
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.slug ? "border-destructive" : "border-border"} text-foreground focus:outline-none focus:border-primary`}
                  placeholder="my-awesome-blog-post"
                />
                {errors.slug && <p className="text-destructive text-xs mt-1">{errors.slug}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Excerpt</label>
              <textarea
                maxLength={500}
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary resize-none"
                placeholder="A brief summary of your post..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Content (Markdown supported)</label>
              <MarkdownEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Write your blog post content here using Markdown..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  maxLength={500}
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                  placeholder="React, TypeScript, Web Dev"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Reading Time (minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={formData.reading_time_minutes}
                  onChange={(e) => setFormData({ ...formData, reading_time_minutes: parseInt(e.target.value) || 5 })}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Cover Image</label>
              <div className="flex items-center gap-4">
                {formData.cover_image_url && (
                  <img
                    src={formData.cover_image_url}
                    alt="Preview"
                    className="w-32 h-20 object-cover rounded-lg"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="blog-cover-image"
                />
                <label htmlFor="blog-cover-image">
                  <Button variant="outline" asChild disabled={uploading}>
                    <span>
                      {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload Cover
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingPost ? "Update Post" : "Create Post"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`p-4 rounded-xl bg-card border border-border flex gap-4 ${!post.is_published ? "opacity-60" : ""}`}
          >
            {post.cover_image_url && (
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-32 h-24 object-cover rounded-lg shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(post)} title="Edit">
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePublished(post)}
                    title={post.is_published ? "Unpublish" : "Publish"}
                  >
                    {post.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(post.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {format(new Date(post.created_at), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {post.reading_time_minutes} min read
                </span>
                {post.is_published ? (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">Published</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Draft</span>
                )}
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.tags.slice(0, 4).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-md bg-secondary text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No blog posts yet. Click "New Post" to write your first article!</p>
        </div>
      )}
    </div>
  );
};
