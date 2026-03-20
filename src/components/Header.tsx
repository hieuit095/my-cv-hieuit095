import { Menu, X, LogIn, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useProfile, useSectionVisibility } from "@/hooks/usePortfolioData";
import { CVPreviewModal } from "@/components/CVPreviewModal";

const baseNavItems = [
  { label: "Home", href: "#home" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
];

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showCVModal, setShowCVModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profile } = useProfile();
  const { data: visibility } = useSectionVisibility();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Build nav items based on visibility
  const navItems = [
    ...baseNavItems,
    ...(visibility?.show_blog ? [{ label: "Blog", href: "/blog" }] : []),
    { label: "Contact", href: "#contact" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsOpen(false);
    
    if (href.startsWith("/")) {
      e.preventDefault();
      navigate(href);
    } else if (href.startsWith("#")) {
      // If not on home page, navigate to home with hash
      if (location.pathname !== "/") {
        e.preventDefault();
        navigate("/" + href);
      }
      // If on home page, let the default anchor behavior work
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-display text-lg md:text-xl font-bold shrink-0">
            <span className="text-primary">&lt;</span>
            {profile?.full_name ? profile.full_name.split(" ")[0] : "Dev"}
            <span className="text-primary">/&gt;</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href.startsWith("/") ? item.href : item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium cursor-pointer whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCVModal(true)}
            >
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline">Download CV</span>
              <span className="lg:hidden">CV</span>
            </Button>
            {user ? (
              <Button size="sm" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate("/auth")}>
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground p-2 -mr-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <nav className="md:hidden py-2 border-t border-border animate-fade-in">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="block py-3 px-1 text-base text-muted-foreground hover:text-primary transition-colors cursor-pointer border-b border-border/40 last:border-0"
              >
                {item.label}
              </a>
            ))}
            <div className="flex gap-2 mt-4 mb-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setIsOpen(false);
                  setShowCVModal(true);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download CV
              </Button>
              {user ? (
                <Button size="sm" className="flex-1" onClick={() => { setIsOpen(false); navigate("/dashboard"); }}>
                  Dashboard
                </Button>
              ) : (
                <Button size="sm" className="flex-1" onClick={() => { setIsOpen(false); navigate("/auth"); }}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
      
      <CVPreviewModal open={showCVModal} onOpenChange={setShowCVModal} />
    </header>
  );
};
