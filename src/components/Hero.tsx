import { ArrowDown, Github, Linkedin, Twitter, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/usePortfolioData";
import { Skeleton } from "@/components/ui/skeleton";
import { CodeBackground } from "@/components/animations/CodeBackground";
import { useDownloadCV } from "@/hooks/useDownloadCV";

export const Hero = () => {
  const { data: profile, isLoading } = useProfile();
  const { downloadCV, isGenerating } = useDownloadCV();

  if (isLoading) {
    return (
      <section id="home" className="min-h-screen flex items-center pt-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="h-16 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <Skeleton className="w-72 h-72 md:w-80 md:h-80 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const socialLinks = [
    { icon: Github, url: profile?.github_url, label: "GitHub" },
    { icon: Linkedin, url: profile?.linkedin_url, label: "LinkedIn" },
    { icon: Twitter, url: profile?.twitter_url, label: "Twitter" },
    { icon: Globe, url: profile?.website_url, label: "Website" },
    { icon: Mail, url: profile?.email ? `mailto:${profile.email}` : undefined, label: "Email" },
  ].filter(link => link.url);

  return (
    <section id="home" className="min-h-screen flex items-center pt-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <CodeBackground />
      
      <div className="container mx-auto px-4 relative z-10 py-12 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="order-2 lg:order-1 animate-fade-in">
            <p className="section-label">Hello, I'm</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4">
              {profile?.full_name || "Developer"}
            </h1>
            {profile?.title && (
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-primary mb-3 md:mb-4">
                {profile.title}
              </h2>
            )}
            <p className="text-muted-foreground text-base sm:text-lg mb-6 md:mb-8 max-w-lg">
              {profile?.bio || "Crafting exceptional digital experiences with clean code and innovative solutions."}
            </p>

            <div className="flex flex-wrap gap-3 md:gap-4 mb-6 md:mb-8">
              <Button variant="hero" size="lg" onClick={downloadCV} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Download CV"}
                <ArrowDown className="ml-2" />
              </Button>
              <Button variant="glass" size="lg" asChild>
                <a href="#projects">View Projects</a>
              </Button>
            </div>

            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">Follow me:</span>
                <div className="flex gap-2 sm:gap-3">
                  {socialLinks.map((social, i) => (
                    <a
                      key={i}
                      href={social.url || "#"}
                      target={social.url?.startsWith("mailto:") ? "_self" : "_blank"}
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all hover:shadow-[0_0_15px_hsl(84_81%_44%/0.2)]"
                    >
                      <social.icon size={18} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="order-1 lg:order-2 flex justify-center animate-scale-in">
            <div className="relative mt-4 lg:mt-0">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80">
                <div className="absolute inset-0 rounded-2xl overflow-hidden z-10 bg-background border border-border">
                  {profile?.profile_image_url ? (
                    <img
                      src={profile.profile_image_url}
                      alt={profile.full_name || "Profile photo"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-5xl sm:text-6xl">
                      👤
                    </div>
                  )}
                </div>
              </div>
              {/* Decorative code badge */}
              <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-card border border-border rounded-xl p-2 sm:p-4 shadow-lg animate-float z-20">
                <div className="text-primary text-lg sm:text-2xl font-display">&lt;/&gt;</div>
              </div>
              {/* Experience badge */}
              {profile?.years_experience && profile.years_experience > 0 && (
                <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-primary text-primary-foreground rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 font-display text-xs sm:text-sm shadow-lg z-20">
                  {profile.years_experience}+ Years
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
