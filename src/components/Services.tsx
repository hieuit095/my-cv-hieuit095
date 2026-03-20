import { Code as Code2, Smartphone, Cloud, Database, Settings, Layers, Palette, Shield, Zap, Globe, Video as LucideIcon, Mail } from "lucide-react";
import { useServices } from "@/hooks/usePortfolioData";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, LucideIcon> = {
  Code2,
  Smartphone,
  Cloud,
  Database,
  Settings,
  Layers,
  Palette,
  Shield,
  Zap,
  Globe,
};

export const Services = () => {
  const { data: services, isLoading } = useServices();

  if (isLoading) {
    return (
      <section id="about" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Skeleton className="h-4 w-20 mx-auto mb-4" />
            <Skeleton className="h-12 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-6 rounded-xl bg-card border border-border">
                <Skeleton className="w-12 h-12 rounded-lg mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!services || services.length === 0) return null;

  return (
    <section id="about" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="section-label">Expertise</p>
          <h2 className="section-title">
            Designing solutions{" "}
            <span className="text-primary">customized</span>{" "}
            to meet your requirements
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {services.map((service, i) => {
            const IconComponent = service.icon ? iconMap[service.icon] : Code2;
            
            return (
              <div
                key={service.id}
                className="group p-4 sm:p-6 rounded-xl bg-card border border-border card-hover flex flex-col"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  {IconComponent ? <IconComponent size={24} /> : <Code2 size={24} />}
                </div>
                <h3 className="font-display text-lg font-semibold mb-2 text-foreground">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-sm flex-1">
                  {service.description}
                </p>
                <a
                  href="#contact"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group/link"
                >
                  <Mail size={14} className="transition-transform group-hover/link:scale-110" />
                  Contact Me
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
