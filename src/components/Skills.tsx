import { useSkills } from "@/hooks/usePortfolioData";
import { Skeleton } from "@/components/ui/skeleton";

export const Skills = () => {
  const { data: skills, isLoading } = useSkills();

  if (isLoading) {
    return (
      <section id="skills" className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Skeleton className="h-4 w-20 mx-auto mb-4" />
            <Skeleton className="h-10 w-40 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-32 mb-4" />
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <Skeleton key={j} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!skills || skills.length === 0) return null;

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <section id="skills" className="py-24 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="section-label">Expertise</p>
          <h2 className="section-title">My Skills</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {Object.entries(skillsByCategory).map(([category, categorySkills], i) => (
            <div key={category} className="space-y-3">
              <h3 className="font-display font-semibold text-base md:text-lg text-foreground capitalize border-b border-border pb-2">
                {category}
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {categorySkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-background border border-border hover:border-primary/50 transition-all group cursor-default"
                  >
                    <span className="text-xl">{skill.icon || "💻"}</span>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
