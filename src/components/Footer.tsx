import { Heart, Mail } from "lucide-react";
import { useProfile } from "@/hooks/usePortfolioData";

export const Footer = () => {
  const { data: profile } = useProfile();
  
  return (
    <footer className="py-8 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-display text-lg md:text-xl font-bold">
            <span className="text-primary">&lt;</span>
            {profile?.full_name ? profile.full_name.split(" ")[0] : "Dev"}
            <span className="text-primary">/&gt;</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 text-center">
            © {new Date().getFullYear()} All rights reserved. Made with{" "}
            <Heart size={12} className="text-primary fill-primary shrink-0" /> by {profile?.full_name || "Developer"}
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            {profile?.email && (
              <a
                href={`mailto:${profile.email}`}
                aria-label="Email"
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all hover:shadow-[0_0_15px_hsl(84_81%_44%/0.2)]"
              >
                <Mail size={15} />
              </a>
            )}
            <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
