import { useState } from "react";
import { GraduationCap, Briefcase, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useEducation, useExperiences } from "@/hooks/usePortfolioData";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelineProps {
  showExperience?: boolean;
  showEducation?: boolean;
}

const ExpandableDetails = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
      >
        {open ? (
          <><ChevronUp size={13} /> Hide details</>
        ) : (
          <><ChevronDown size={13} /> Show details</>
        )}
      </button>
      {open && (
        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const EducationItem = ({ item }: { item: NonNullable<ReturnType<typeof useEducation>["data"]>[number] }) => {
  const hasDetails = !!item.description;

  return (
    <div className="relative pl-6 border-l-2 border-border hover:border-primary transition-colors group">
      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-border group-hover:border-primary group-hover:bg-primary transition-all" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Calendar size={12} />
        {item.year}
      </div>
      <h3 className="font-display font-semibold text-foreground mb-0.5">{item.degree}</h3>
      <p className="text-primary text-sm">{item.institution}</p>
      {hasDetails && (
        <ExpandableDetails>
          <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
        </ExpandableDetails>
      )}
    </div>
  );
};

const ExperienceItem = ({ item }: { item: NonNullable<ReturnType<typeof useExperiences>["data"]>[number] }) => {
  const hasDetails = item.description || (item.highlights && item.highlights.length > 0);

  return (
    <div className="relative pl-6 border-l-2 border-border hover:border-primary transition-colors group">
      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-border group-hover:border-primary group-hover:bg-primary transition-all" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Calendar size={12} />
        {item.period}
      </div>
      <h3 className="font-display font-semibold text-foreground mb-0.5">{item.role}</h3>
      <p className="text-primary text-sm">{item.company}</p>
      {hasDetails && (
        <ExpandableDetails>
          {item.description && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">{item.description}</p>
          )}
          {item.highlights && item.highlights.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.highlights.map((tag, j) => (
                <span key={j} className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </ExpandableDetails>
      )}
    </div>
  );
};

export const Timeline = ({ showExperience = true, showEducation = true }: TimelineProps) => {
  const { data: education, isLoading: loadingEducation } = useEducation();
  const { data: experiences, isLoading: loadingExperiences } = useExperiences();

  const isLoading = loadingEducation || loadingExperiences;

  if (isLoading) {
    return (
      <section id="experience" className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {[1, 2].map((col) => (
              <div key={col}>
                <div className="flex items-center gap-3 mb-8">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="pl-6 border-l-2 border-border">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-6 w-48 mb-1" />
                      <Skeleton className="h-4 w-32 mb-2" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const hasEducation = showEducation && education && education.length > 0;
  const hasExperiences = showExperience && experiences && experiences.length > 0;

  if (!hasEducation && !hasExperiences) return null;

  return (
    <section id="experience" className="py-24 bg-card/30">
      <div className="container mx-auto px-4">
        <div className={`grid ${hasEducation && hasExperiences ? "md:grid-cols-2" : ""} gap-8 lg:gap-12`}>
          {hasEducation && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <GraduationCap size={20} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-display">Education</h2>
              </div>
              <div className="space-y-6">
                {education.map((item) => (
                  <EducationItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {hasExperiences && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Briefcase size={20} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-display">Experience</h2>
              </div>
              <div className="space-y-6">
                {experiences.map((item) => (
                  <ExperienceItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
