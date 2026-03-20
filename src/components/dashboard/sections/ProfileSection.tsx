import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Save, Upload, Loader as Loader2 } from "lucide-react";
import { profileSchema } from "@/lib/validations";
import { ImageCropper } from "@/components/dashboard/ImageCropper";

interface ProfileData {
  full_name: string;
  title: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  profile_image_url: string;
  github_url: string;
  linkedin_url: string;
  twitter_url: string;
  website_url: string;
  years_experience: number;
  projects_completed: number;
  clients_served: number;
  awards_won: number;
}

export const ProfileSection = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    title: "",
    bio: "",
    email: "",
    phone: "",
    location: "",
    profile_image_url: "",
    github_url: "",
    linkedin_url: "",
    twitter_url: "",
    website_url: "",
    years_experience: 0,
    projects_completed: 0,
    clients_served: 0,
    awards_won: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      toast.error("Error loading profile");
    } else if (data) {
      setProfile({
        full_name: data.full_name || "",
        title: data.title || "",
        bio: data.bio || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        profile_image_url: data.profile_image_url || "",
        github_url: data.github_url || "",
        linkedin_url: data.linkedin_url || "",
        twitter_url: data.twitter_url || "",
        website_url: data.website_url || "",
        years_experience: data.years_experience || 0,
        projects_completed: data.projects_completed || 0,
        clients_served: data.clients_served || 0,
        awards_won: data.awards_won || 0,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const result = profileSchema.safeParse(profile);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the validation errors");
      return;
    }
    
    setErrors({});
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", userId);

    if (error) {
      toast.error("Error saving profile");
    } else {
      toast.success("Profile saved successfully");
    }
    setSaving(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be less than 20MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCropperSrc(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropApply = async (blob: Blob) => {
    setCropperSrc(null);
    setUploading(true);

    const filePath = `${userId}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("profile-images")
      .upload(filePath, blob, { contentType: "image/jpeg" });

    if (uploadError) {
      toast.error("Error uploading image");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("profile-images")
      .getPublicUrl(filePath);

    setProfile((prev) => ({ ...prev, profile_image_url: data.publicUrl }));
    setUploading(false);
    toast.success("Photo updated successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          onApply={handleCropApply}
          onCancel={() => setCropperSrc(null)}
        />
      )}

    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Image */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold text-foreground mb-4">Profile Photo</h2>
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-secondary overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-border">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground text-sm text-center px-2">No Photo</span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="profile-image"
              />
              <label htmlFor="profile-image">
                <Button variant="outline" asChild disabled={uploading}>
                  <span>
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Photo
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Any size or format. You can crop and zoom after selecting.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold text-foreground mb-4">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <input
                type="text"
                maxLength={100}
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.full_name ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                placeholder="John Doe"
              />
              {errors.full_name && <p className="text-destructive text-xs mt-1">{errors.full_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Professional Title
              </label>
              <input
                type="text"
                maxLength={200}
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.title ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                placeholder="Senior Full Stack Developer"
              />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Bio
              </label>
              <textarea
                maxLength={2000}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.bio ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors resize-none`}
                placeholder="Tell us about yourself..."
              />
              {errors.bio && <p className="text-destructive text-xs mt-1">{errors.bio}</p>}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold text-foreground mb-4">Contact Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                maxLength={255}
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.email ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone
              </label>
              <input
                type="tel"
                maxLength={30}
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.phone ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                placeholder="+1 234 567 8901"
              />
              {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Location
              </label>
              <input
                type="text"
                maxLength={200}
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.location ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                placeholder="San Francisco, CA"
              />
              {errors.location && <p className="text-destructive text-xs mt-1">{errors.location}</p>}
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold text-foreground mb-4">Social Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                GitHub
              </label>
              <input
                type="url"
                maxLength={500}
                value={profile.github_url}
                onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.github_url ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                placeholder="https://github.com/username"
              />
              {errors.github_url && <p className="text-destructive text-xs mt-1">{errors.github_url}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                LinkedIn
              </label>
              <input
                type="url"
                maxLength={500}
                value={profile.linkedin_url}
                onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.linkedin_url ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                placeholder="https://linkedin.com/in/username"
              />
              {errors.linkedin_url && <p className="text-destructive text-xs mt-1">{errors.linkedin_url}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Twitter
              </label>
              <input
                type="url"
                maxLength={500}
                value={profile.twitter_url}
                onChange={(e) => setProfile({ ...profile, twitter_url: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.twitter_url ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                placeholder="https://twitter.com/username"
              />
              {errors.twitter_url && <p className="text-destructive text-xs mt-1">{errors.twitter_url}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Website
              </label>
              <input
                type="url"
                maxLength={500}
                value={profile.website_url}
                onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.website_url ? 'border-destructive' : 'border-border'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                placeholder="https://yourwebsite.com"
              />
              {errors.website_url && <p className="text-destructive text-xs mt-1">{errors.website_url}</p>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="font-semibold text-foreground mb-4">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Years Experience
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={profile.years_experience}
                onChange={(e) => setProfile({ ...profile, years_experience: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Projects Done
              </label>
              <input
                type="number"
                min={0}
                max={10000}
                value={profile.projects_completed}
                onChange={(e) => setProfile({ ...profile, projects_completed: Math.min(10000, Math.max(0, parseInt(e.target.value) || 0)) })}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Clients Served
              </label>
              <input
                type="number"
                min={0}
                max={10000}
                value={profile.clients_served}
                onChange={(e) => setProfile({ ...profile, clients_served: Math.min(10000, Math.max(0, parseInt(e.target.value) || 0)) })}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Awards Won
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                value={profile.awards_won}
                onChange={(e) => setProfile({ ...profile, awards_won: Math.min(1000, Math.max(0, parseInt(e.target.value) || 0)) })}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
