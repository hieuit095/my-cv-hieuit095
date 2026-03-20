import { MapPin, Send, Github, Linkedin, Twitter, Loader as Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { contactSchema } from "@/lib/validations";
import { toast } from "sonner";
import { useProfile, useFirstUserId } from "@/hooks/usePortfolioData";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useRateLimit } from "@/hooks/useRateLimit";

export const Contact = () => {
  const { data: profile, isLoading } = useProfile();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { data: portfolioUserId } = useFirstUserId();
  
  // Rate limiting: 3 submissions per 15 minutes
  const { isLimited, remainingTime, checkLimit, recordAttempt, formatRemainingTime } = useRateLimit({
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000,
    storageKey: "contact_form_attempts",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check client-side rate limit
    if (!checkLimit()) {
      toast.error(`Too many submissions. Please try again in ${formatRemainingTime(remainingTime)}.`);
      return;
    }
    
    const result = contactSchema.safeParse(formData);
    
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
    
    if (!portfolioUserId) {
      toast.error("Unable to send message at this time");
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const { data, error } = await supabase.functions.invoke("submit-contact", {
        body: {
          userId: portfolioUserId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        if (data.retryAfter) {
          toast.error(`Too many submissions. Please try again in ${Math.ceil(data.retryAfter / 60)} minutes.`);
        } else {
          toast.error(data.error);
        }
        return;
      }

      // Record successful submission for client-side rate limiting
      recordAttempt();
      toast.success("Message sent successfully!");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const socialLinks = [
    { icon: Github, url: profile?.github_url, label: "GitHub" },
    { icon: Linkedin, url: profile?.linkedin_url, label: "LinkedIn" },
    { icon: Twitter, url: profile?.twitter_url, label: "Twitter" },
  ].filter(link => link.url);

  return (
    <section id="contact" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="section-label">Get In Touch</p>
          <h2 className="section-title">Let's Connect</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="p-8 rounded-2xl bg-card border border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.name ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors`}
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    maxLength={255}
                    className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.email ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors`}
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="tel"
                    maxLength={30}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-background border ${errors.phone ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors`}
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  maxLength={200}
                  className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.subject ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors`}
                  placeholder="Project inquiry"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
                {errors.subject && <p className="text-destructive text-xs mt-1">{errors.subject}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message *
                </label>
                <textarea
                  rows={5}
                  maxLength={2000}
                  className={`w-full px-4 py-3 rounded-lg bg-background border ${errors.message ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none`}
                  placeholder="Tell me about your project..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
                {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={18} />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="ml-2" size={18} />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-20 mb-1" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {profile?.location && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground mb-1">Location</h3>
                      <p className="text-muted-foreground">{profile.location}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {socialLinks.length > 0 && (
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="font-display font-semibold text-foreground mb-4">Follow Me</h3>
                <div className="flex gap-3">
                  {socialLinks.map((social, i) => (
                    <a
                      key={i}
                      href={social.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:shadow-[0_0_15px_hsl(84_81%_44%/0.2)] transition-all"
                      aria-label={social.label}
                    >
                      <social.icon size={20} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
